console.log("🔥 THIS IS MY SERVER FILE RUNNING");
console.log("SERVER FILE LOADED");
console.log("🔥 NEW SERVER CODE RUNNING");
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateScenesWithImages, generateScenes } from "./server-scenes.js";
import { createVideoFromImages } from "./server-video-from-images.js";
import { createCinematicVideo } from "./server-cinematic-video.js";
import developerPortalAPI from "./developer-portal-api.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnvFiles = () => {
  // Try current directory first
  dotenv.config({ path: path.join(process.cwd(), ".env"), override: false });
  dotenv.config({ path: path.join(process.cwd(), "src", ".env"), override: true });
  
  // Try relative to server.js directory (__dirname)
  dotenv.config({ path: path.join(__dirname, ".env"), override: false });
  dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });
  dotenv.config({ path: path.join(__dirname, "../src/.env"), override: true });
  dotenv.config({ path: path.join(__dirname, "../Frontend/src/.env"), override: true });
};

// Load environment variables (including JSON2VIDEO_API_KEY and Supabase keys)
loadEnvFiles();

const readEnv = (name) => process.env[name] || process.env[`VITE_${name}`] || "";

const toErrorMessage = (value, fallback = "Unexpected error") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;

  if (typeof value === "object") {
    const candidate = value.error || value.detail || value.message || value.reason;
    if (candidate) {
      return typeof candidate === "string" ? candidate : JSON.stringify(candidate);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const falApiKey = readEnv("FAL_API_KEY");
fal.config({
  credentials: falApiKey,
});

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SET FFMPEG
ffmpeg.setFfmpegPath(ffmpegPath);

// ✅ FILE UPLOAD (uses OS temp directory – no local uploads/ folder)
const upload = multer({ dest: os.tmpdir() });

const tempWorkDir = path.join(os.tmpdir(), "aivideoeditor1-temp");
fs.mkdirSync(tempWorkDir, { recursive: true });

const makeTempFilePath = (suffix) => {
  const safeSuffix = String(suffix || "temp.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filePath = path.join(tempWorkDir, `${unique}-${safeSuffix}`);

  // Ensure the output parent directory exists for ffmpeg on Windows.
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
};

const downloadRemoteFile = async (remoteUrl, defaultSuffix = "remote.mp3") => {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download remote audio: ${response.status} ${response.statusText}`);
  }

  const url = new URL(remoteUrl);
  const ext = path.extname(url.pathname) || ".mp3";
  const outputPath = makeTempFilePath(`downloaded-audio${ext}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(outputPath, buffer);
  return outputPath;
};

const buildSrt = (captions) => {
  return captions
    .map((caption, index) => {
      const startHms = new Date(caption.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      const endHms = new Date(caption.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      return `${index + 1}\n${startHms} --> ${endHms}\n${caption.text.replace(/\r?\n/g, ' ')}\n`;
    })
    .join("\n");
};

const normalizeSubtitlePath = (filePath) => filePath.replace(/\\/g, "/");

// ✅ INIT SUPABASE (env-only, no hardcoded secrets)
const supabaseUrl = readEnv("SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

console.log("🔍 Parsed service role key length:", serviceRoleKey ? serviceRoleKey.length : 0);
console.log(
  "🔍 Parsed service role key prefix:",
  serviceRoleKey ? serviceRoleKey.slice(0, 10) + "..." : "<none>",
);
console.log(
  "🔍 ENV SUPABASE_ANON_KEY prefix:",
  readEnv("SUPABASE_ANON_KEY")
    ? readEnv("SUPABASE_ANON_KEY").slice(0, 10) + "..."
    : "<none>",
);

const supabaseKey = serviceRoleKey || readEnv("SUPABASE_ANON_KEY") || "";
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in environment.");
}
// Bucket mapping by function.
const SUPABASE_BUCKETS = {
  AI_GENERATED: (readEnv("SUPABASE_BUCKET_AI_GENERATED") || "AI_Generated_Video").trim(),
  IMAGE_TO_VIDEO: (readEnv("SUPABASE_BUCKET_IMAGE_TO_VIDEO") || "Image-to-video_function").trim(),
  REFERENCE_VIDEO: (readEnv("SUPABASE_BUCKET_REFERENCE_VIDEO") || "Reference_video_function").trim(),
  QUICK_EDITS: (readEnv("SUPABASE_BUCKET_QUICK_EDITS") || "quick_edits").trim(),
};

const supabaseBucket = (readEnv("SUPABASE_STORAGE_BUCKET") || SUPABASE_BUCKETS.IMAGE_TO_VIDEO).trim();
console.log("🔗 Supabase URL:", supabaseUrl);
console.log("🔗 Supabase key prefix:", supabaseKey ? supabaseKey.slice(0, 10) + "..." : "<none>");
console.log("🌐 Global fetch available:", typeof fetch !== "undefined");
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("🔗 Supabase bucket configured:", supabaseBucket);
console.log("🔗 Supabase bucket map:", SUPABASE_BUCKETS);
const INTERNAL_ROLES = new Set(["super_admin", "admin", "developer", "tester"]);

// Optional: log available buckets at startup for debugging
supabase.storage
  .listBuckets()
  .then((res) => {
    if (Array.isArray(res.data)) {
      console.log(
        "📦 Supabase buckets:",
        res.data.map((b) => b.name),
      );
    } else if (res.error) {
      console.log("⚠️ Could not list buckets:", res.error.message || res.error);
    }
  })
  .catch((e) => {
    console.log("⚠️ Error listing buckets:", e?.message || e);
  });

const getBearerToken = (req) => {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
};

const getRequestActor = async (req) => {
  const token = getBearerToken(req);
  if (!token) {
    return { user: null, role: "user", bypassCreditChecks: false };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    console.warn("⚠️ [Auth] Unable to resolve request user:", userError?.message || "unknown auth error");
    return { user: null, role: "user", bypassCreditChecks: false };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("app_profiles")
    .select("role,bypass_credit_checks")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.warn("⚠️ [Auth] Unable to resolve app profile:", profileError.message);
  }

  return {
    user: userData.user,
    role: profileData?.role || "user",
    bypassCreditChecks: Boolean(profileData?.bypass_credit_checks),
  };
};

const normalizeUsageContext = (req, actor) => {
  const bodyContext =
    req.body?.usageContext && typeof req.body.usageContext === "object" ? req.body.usageContext : {};

  const requestedPortal = String(req.headers["x-portal"] || bodyContext.portal || "user").toLowerCase();
  const requestedUsageType = String(req.headers["x-usage-type"] || bodyContext.usageType || "production").toLowerCase();
  const requestedSkip = req.headers["x-skip-credit-check"] === "true" || bodyContext.skipCreditCheck === true;
  const internalAccess = INTERNAL_ROLES.has(actor.role);

  const portal = internalAccess && requestedPortal === "internal" ? "internal" : "user";
  const usageType = internalAccess && requestedUsageType === "test" ? "test" : "production";
  const walletType = usageType === "test" ? "developer_credits" : "user_credits";

  return {
    portal,
    usageType,
    walletType,
    skipCreditCheck: actor.bypassCreditChecks || (internalAccess && requestedSkip),
    actorRole: actor.role,
  };
};

const createUsageLog = async ({ req, actor, featureKey, creditsRequested = 0, metadata = {} }) => {
  const usageContext = normalizeUsageContext(req, actor);

  const { data, error } = await supabase
    .from("usage_logs")
    .insert({
      user_id: actor.user?.id || null,
      actor_role: usageContext.actorRole,
      portal: usageContext.portal,
      usage_type: usageContext.usageType,
      wallet_type: usageContext.walletType,
      feature_key: featureKey,
      credits_requested: creditsRequested,
      credit_check_bypassed: usageContext.skipCreditCheck,
      status: "started",
      metadata,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("⚠️ [Usage] Failed to create usage log:", error.message);
    return { usageLogId: null, usageContext };
  }

  return {
    usageLogId: data?.id || null,
    usageContext,
  };
};

const finalizeUsageLog = async (usageLogId, status, metadata = {}, creditsCharged = 0) => {
  if (!usageLogId) {
    return;
  }

  const { error } = await supabase
    .from("usage_logs")
    .update({
      status,
      credits_charged: creditsCharged,
      metadata,
    })
    .eq("id", usageLogId);

  if (error) {
    console.warn("⚠️ [Usage] Failed to finalize usage log:", error.message);
  }
};

const createApiLog = async ({ usageLogId, endpoint, requestPayload = {}, responsePayload = {}, statusCode = 200, latencyMs = null }) => {
  const { error } = await supabase.from("api_logs").insert({
    usage_log_id: usageLogId,
    endpoint,
    request_payload: requestPayload,
    response_payload: responsePayload,
    status_code: statusCode,
    latency_ms: latencyMs,
  });

  if (error) {
    console.warn("⚠️ [Usage] Failed to create API log:", error.message);
  }
};

// ✅ INIT JSON2VIDEO API
const json2VideoApiKey = readEnv("JSON2VIDEO_API_KEY") || "";
const json2VideoApiUrl = (readEnv("JSON2VIDEO_API_URL") || "https://api.json2video.com/v2").replace(/\/$/, "");
const USE_MOCK_API = readEnv("USE_MOCK_API") === "true"; // Set USE_MOCK_API=true for testing without valid API key

// ✅ INIT NOVITA API (optional provider for text-to-video)
const novitaApiKey = readEnv("NOVITA_API_KEY") || "";
const novitaApiUrl = readEnv("NOVITA_API_URL") || "";
const videoProvider = (readEnv("VIDEO_PROVIDER") || "json2video").toLowerCase();
const novitaModelName = readEnv("NOVITA_MODEL_NAME") || "";
const replicateApiToken = readEnv("REPLICATE_API_TOKEN") || "";
const replicateApiUrl = (readEnv("REPLICATE_API_URL") || "https://api.replicate.com/v1").replace(/\/$/, "");
const replicateModel = readEnv("REPLICATE_MODEL") || "bytedance/seedance-1-lite";
const openRouterApiKey = readEnv("OPENROUTER_API_KEY") || "";
const openRouterModel = readEnv("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
const openRouterBaseUrl = (readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1").replace(/\/$/, "");
const openRouterAppName = readEnv("OPENROUTER_APP_NAME") || "vireonix-ai";
const openRouterSiteUrl = readEnv("OPENROUTER_SITE_URL") || "http://localhost:5173";

// ✅ INIT GEMINI (used as understanding layer for media flows)
const geminiApiKey = readEnv("GEMINI_API_KEY") || "";
const geminiModelId = readEnv("GEMINI_MODEL_ID") || "gemini-2.5-flash";
// ✅ Veo model for AI video generation (images only for now)
const veoModelId = readEnv("VEO_MODEL_ID") || "veo-3.1-generate-preview";

console.log("✅ Video generation service configured");
if (USE_MOCK_API) {
  console.log("⚠️  USING MOCK API (testing mode)");
} else {
  console.log("🔑 Using real video provider:", videoProvider);
}

// ✅ TEST ROUTE
app.get("/", (req, res, next) => {
  const distPath = path.resolve(__dirname, "dist");
  if (fs.existsSync(distPath)) {
    return next();
  }
  res.send("Server is alive");
});

app.get("/test", (req, res) => {
  console.log("✅ TEST ROUTE HIT");
  res.send("OK");
});

// ✅ VIDEO PROCESS FUNCTION (uploaded source - trims/exports video)
const processVideo = (input, output, duration = null) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(input).setStartTime(0);

    if (Number.isFinite(Number(duration)) && Number(duration) > 0) {
      command = command.setDuration(Number(duration));
    }

    command
      .output(output)
      .on("end", () => {
        console.log("✅ Video processed");
        resolve(output);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg Error:", err);
        reject(err);
      })
      .run();
  });
};

const processVideoRange = (input, output, start = 0, duration = null) => {
  return new Promise((resolve, reject) => {
    const startTime = Math.max(0, Number(start) || 0);
    const hasTrim = startTime > 0 || (Number.isFinite(Number(duration)) && Number(duration) > 0);
    
    console.log(`⏱️  [FFMPEG] processVideoRange:`, {
      input: input.split('/').pop(),
      output: output.split('/').pop(),
      startTime: startTime,
      duration: duration,
      hasTrim: hasTrim,
    });
    
    let command = ffmpeg(input).setStartTime(startTime);

    if (Number.isFinite(Number(duration)) && Number(duration) > 0) {
      command = command.setDuration(Number(duration));
    }

    command
      .outputOptions([
        "-c:v libx264",
        "-preset ultrafast",
        "-crf 22"
      ])
      .output(output)
      .on("end", () => {
        console.log(`✅ [FFMPEG] Video range processed successfully`);
        resolve(output);
      })
      .on("error", (err) => {
        console.error("❌ [FFMPEG] Range Error:", err);
        reject(err);
      })
      .run();
  });
};

const getVideoDuration = (inputPath) => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        resolve(10);
        return;
      }
      const duration = Number(metadata?.format?.duration || 10);
      resolve(Number.isFinite(duration) && duration > 0 ? duration : 10);
    });
  });
};

// ✅ Trim/merge audio to match a given video
const mergeVideoWithTrimmedAudio = async (videoPath, audioPath) => {
  if (!videoPath || !audioPath) return videoPath;

  const videoDuration = await getVideoDuration(videoPath);
  const hasAudio = await hasAudioStream(videoPath);
  const outputPath = makeTempFilePath("with-audio.mp4");

  console.log(`🎵 [AUDIO] Merging audio track. Original video has audio: ${hasAudio}, duration: ${videoDuration.toFixed(3)}s`);

  if (hasAudio) {
    // Both video and audio have audio tracks. We mix them using amix.
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter([
          `[0:a:0]volume=1.0[a0]`,
          `[1:a:0]volume=1.0[a1]`,
          `[a0][a1]amix=inputs=2:duration=first[a]`
        ])
        .outputOptions([
          "-map 0:v:0",
          "-map [a]",
          "-c:v copy",
          "-c:a aac",
          `-t ${videoDuration.toFixed(3)}`
        ])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ [AUDIO] Audio streams mixed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ [AUDIO] Error mixing audio streams:", err);
          reject(err);
        })
        .run();
    });
  } else {
    // Video has no audio. We can just add the trimmed custom audio.
    const trimmedAudioPath = makeTempFilePath("trimmed-audio.mp4");

    await new Promise((resolve, reject) => {
      ffmpeg(audioPath)
        .outputOptions([`-t ${videoDuration.toFixed(3)}`])
        .output(trimmedAudioPath)
        .on("end", () => resolve())
        .on("error", (err) => {
          console.error("❌ [AUDIO] Error trimming audio:", err);
          reject(err);
        })
        .run();
    });

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(trimmedAudioPath)
        .outputOptions(["-c:v copy", "-c:a aac"])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ [AUDIO] Custom audio track added to silent video");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ [AUDIO] Error merging audio:", err);
          reject(err);
        })
        .run();
    });

    fs.unlink(trimmedAudioPath, () => {});
  }

  return outputPath;
};

// ✅ Adjust a generated video to match the user-selected frame
// (aspect ratio) after the API has produced it.
const adjustVideoToFrame = async (inputPath, frame) => {
  if (!inputPath) return inputPath;

  const resolutionMap = {
    "16:9": "1920x1080",
    "9:16": "1080x1920",
    "1:1": "1080x1080",
    "4:3": "1440x1080",
    "3:4": "1080x1440",
    "4:5": "1080x1350",
    "2.35:1": "1920x817",
  };

  const size = resolutionMap[frame] || resolutionMap["16:9"];
  if (!size) return inputPath;

  const [wStr, hStr] = size.split("x");
  const w = Number(wStr) || 1920;
  const h = Number(hStr) || 1080;

  const outputPath = makeTempFilePath("frame-adjusted.mp4");

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(
        `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`,
      )
      .outputOptions(["-c:a copy"])
      .output(outputPath)
      .on("end", () => {
        console.log("✅ [FRAME] Adjusted video to frame", frame, `(${w}x${h})`);
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ [FRAME] Error adjusting frame:", err);
        reject(err);
      })
      .run();
  });

  return outputPath;
};

// ✅ IMAGE → VIDEO FUNCTION (loops single image for given duration)
const createVideoFromImage = (imagePath, outputPath, duration = 10, frame = "16:9") => {
  const resolutionMap = {
    "16:9": "1920x1080",
    "9:16": "1080x1920",
    "1:1": "1080x1080",
    "4:3": "1440x1080",
    "3:4": "1080x1440",
    "4:5": "1080x1350",
    "2.35:1": "1920x817",
  };

  const size = resolutionMap[frame] || resolutionMap["16:9"];

  return new Promise((resolve, reject) => {
    let command = ffmpeg(imagePath)
      .loop()
      .setDuration(duration)
      .outputOptions([
        "-c:v libx264",
        "-preset ultrafast",
        "-crf 22",
        `-t ${duration}`,
        "-pix_fmt yuv420p",
      ]);

    if (size) {
      command = command.size(size);
    }

    command
      .output(outputPath)
      .on("end", () => {
        console.log("✅ Image converted to video");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg Image->Video Error:", err);
        reject(err);
      })
      .run();
  });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractOutputUrl = (predictionOutput) => {
  if (!predictionOutput) {
    return "";
  }
  if (typeof predictionOutput === "string") {
    return predictionOutput;
  }
  if (Array.isArray(predictionOutput) && predictionOutput.length > 0) {
    return typeof predictionOutput[0] === "string" ? predictionOutput[0] : "";
  }
  if (typeof predictionOutput === "object") {
    if (typeof predictionOutput.url === "string") {
      return predictionOutput.url;
    }
    if (typeof predictionOutput.video === "string") {
      return predictionOutput.video;
    }
  }
  return "";
};

const ensurePlayableVideoUrl = (url, context) => {
  const normalized = typeof url === "string" ? url.trim() : "";
  if (!normalized) {
    throw new Error(`${context} did not return a playable video URL.`);
  }
  return normalized;
};

const getSupabasePlaybackUrl = async (bucketName, storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    if (error) {
      console.warn("⚠️ [STORAGE] createSignedUrl failed, trying public URL:", error.message || error);
    }
  } catch (error) {
    console.warn("⚠️ [STORAGE] createSignedUrl threw error, trying public URL:", error?.message || error);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return ensurePlayableVideoUrl(data?.publicUrl, "Supabase public URL");
};

const uploadVideoUrlToSupabase = async (videoUrl, fileName, bucketName = supabaseBucket) => {
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Unable to download generated video: ${videoResponse.status}`);
  }

  const arrayBuffer = await videoResponse.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const storagePath = `generated/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    console.error("❌ [STORAGE] uploadVideoUrlToSupabase error:", error.message || error);

    throw new Error(`Supabase upload failed: ${error.message || error}`);
  }

  const playbackUrl = ensurePlayableVideoUrl(
    await getSupabasePlaybackUrl(bucketName, storagePath),
    "Supabase playback URL",
  );
  return { publicUrl: playbackUrl, storagePath };
};

const uploadToSupabase = async (filePath, fileName, bucketName = supabaseBucket) => {
  if (!supabase || !supabase.storage) {
    throw new Error("Supabase client is not initialized");
  }

  const fileStats = fs.statSync(filePath);
  const storagePath = `generated/${Date.now()}-${fileName}`;
  console.log("📤 [STORAGE] uploadToSupabase starting", {
    bucketName,
    storagePath,
    filePath,
    fileSize: fileStats.size,
  });

  const fileStream = fs.createReadStream(filePath);
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileStream, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    console.error(
      "❌ [STORAGE] uploadToSupabase error:",
      error.message || error,
      JSON.stringify(error, null, 2),
    );
    throw new Error(`Supabase upload failed: ${error.message || error}`);
  }

  const playbackUrl = ensurePlayableVideoUrl(
    await getSupabasePlaybackUrl(bucketName, storagePath),
    "Supabase playback URL",
  );
  return { publicUrl: playbackUrl, storagePath };
};

const uploadReferenceMediaToSupabase = async (sourcePath, originalName) => {
  const fileBuffer = fs.readFileSync(sourcePath);
  const safeName = String(originalName || "reference.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `reference/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKETS.REFERENCE_VIDEO)
    .upload(storagePath, fileBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKETS.REFERENCE_VIDEO).getPublicUrl(storagePath);
  return {
    publicUrl: ensurePlayableVideoUrl(data?.publicUrl, "Reference media public URL"),
    storagePath,
  };
};

// ✅ Upload a local media file (image/video) to Gemini Files API
// Returns the File's uri and downloadUri if available.
const uploadMediaToGeminiFile = async (filePath, displayName, mimeType) => {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const boundary = `Boundary${Date.now()}`;
  const metadata = JSON.stringify({
    file: {
      displayName: displayName || "upload",
    },
  });

  const fileBuffer = fs.readFileSync(filePath);

  const bodyParts = [];
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n`,
      "utf8",
    ),
  );
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`,
      "utf8",
    ),
  );
  bodyParts.push(fileBuffer);
  bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"));

  const body = Buffer.concat(bodyParts);

  const response = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
    method: "POST",
    headers: {
      "x-goog-api-key": geminiApiKey,
      "X-Goog-Upload-Protocol": "multipart",
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    console.error("❌ [Files] media.upload failed:", response.status, text);
    throw new Error("Failed to upload media to Gemini Files API");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid response from Gemini Files API");
  }

  const file = json.file || json;
  return {
    uri: file.uri || file.name || "",
    downloadUri: file.downloadUri || "",
  };
};

// ✅ Download a Gemini File given its downloadUri into a Buffer
const downloadGeminiFileToBuffer = async (downloadUri) => {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch(downloadUri, {
    headers: {
      "x-goog-api-key": geminiApiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("❌ [Files] download failed:", response.status, text);
    throw new Error("Failed to download Gemini file");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// ✅ Use Veo (Gemini Gen Media) to generate a video from images + prompt
// This is used ONLY when the user uploaded images (no videos).
// The API can only generate short clips (below ~10 seconds), so we
// split the requested duration into multiple segments (e.g. 6+6+6+6+6
// for 30 seconds), generate each segment, then concatenate them locally.
//
// This helper now returns a local video path so the caller can
// optionally merge audio and then upload the final file to Supabase.
const generateVeoVideoFromImages = async (
  prompt,
  durationSeconds,
  aspectRatio,
  imageFiles,
) => {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set for Veo generation");
  }

  const totalSecRaw = Number(durationSeconds) || 8;
  const totalSec = Math.max(4, Math.min(180, totalSecRaw));
  const aspect = aspectRatio || "16:9";

  // Split duration into API-friendly segments (<= 10s each).
  // We bias towards ~6 second chunks so that, for example,
  // 30 seconds becomes 6+6+6+6+6.
  const MAX_SEGMENT = 10;
  const PREFERRED_SEGMENT = 6;

  const segmentDurations = [];
  let remaining = totalSec;

  while (remaining > MAX_SEGMENT) {
    segmentDurations.push(PREFERRED_SEGMENT);
    remaining -= PREFERRED_SEGMENT;
  }

  if (remaining > 0) {
    const last = Math.max(3, Math.min(MAX_SEGMENT, remaining));
    segmentDurations.push(last);
  }

  console.log("🎬 [Veo] Target duration split into segments:", segmentDurations);

  // Upload up to 3 images to Files API once and reuse them for all segments.
  const imagesToUse = imageFiles.slice(0, 3);
  const uploadedImages = [];

  for (const img of imagesToUse) {
    try {
      console.log("📤 [Veo] Uploading image to Gemini Files:", img.originalname);
      const uploaded = await uploadMediaToGeminiFile(img.path, img.originalname, img.mimetype);
      if (uploaded.uri) {
        uploadedImages.push(uploaded);
      }
    } catch (e) {
      console.error("❌ [Veo] Failed to upload image:", e?.message || e);
    }
  }

  if (!uploadedImages.length) {
    throw new Error("No images could be uploaded to Gemini Files for Veo");
  }

  const segmentPaths = [];
  const generatedTempFiles = [];

  // Helper to run one Veo generation for a given segment duration
  const runVeoSegment = async (segmentDuration, index) => {
    const instances = [
      {
        prompt: String(prompt || ""),
        aspectRatio: aspect,
        durationSeconds: segmentDuration,
        referenceImages: uploadedImages.map((img) => ({
          image: {
            fileUri: img.uri,
          },
        })),
      },
    ];

    // Also set the main starting frame as the first image, if present.
    if (uploadedImages[0]) {
      instances[0].image = {
        fileUri: uploadedImages[0].uri,
      };
    }

    console.log("🎬 [Veo] Starting Veo segment", {
      index,
      durationSeconds: segmentDuration,
      aspectRatio: aspect,
      imageCount: uploadedImages.length,
    });

    const requestBody = {
      instances,
      parameters: {
        aspectRatio: aspect,
        durationSeconds: segmentDuration,
        resolution: "720p",
        personGeneration: "allow_all",
      },
    };

    const initialResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${veoModelId}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const initialText = await initialResponse.text();
    if (!initialResponse.ok) {
      console.error("❌ [Veo] predictLongRunning failed:", initialResponse.status, initialText);
      throw new Error("Veo video generation request failed");
    }

    let initialJson;
    try {
      initialJson = JSON.parse(initialText);
    } catch (e) {
      throw new Error("Invalid Veo operation response");
    }

    const operationName = initialJson.name || initialJson.operation?.name;
    if (!operationName) {
      throw new Error("Missing operation name in Veo response");
    }

    console.log("⏳ [Veo] Operation started:", operationName);

    // Poll the long-running operation until done or timeout
    const maxAttempts = 60; // up to ~5 minutes with 5s interval
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(5000);

      const opResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(operationName)}`,
        {
          headers: {
            "x-goog-api-key": geminiApiKey,
          },
        },
      );

      const opText = await opResponse.text();
      if (!opResponse.ok) {
        console.error("❌ [Veo] Operation status failed:", opResponse.status, opText);
        throw new Error("Failed to check Veo operation status");
      }

      let opJson;
      try {
        opJson = JSON.parse(opText);
      } catch (e) {
        throw new Error("Invalid Veo operation status response");
      }

      if (!opJson.done) {
        console.log(`⏳ [Veo] Waiting for completion (${attempt + 1}/${maxAttempts})...`);
        continue;
      }

      if (opJson.error) {
        console.error("❌ [Veo] Operation error:", opJson.error);
        throw new Error("Veo operation failed");
      }

      const response = opJson.response || {};
      const generatedList =
        response.generated_videos || response.generatedVideos || [];

      let videoFile = null;
      if (Array.isArray(generatedList) && generatedList.length > 0) {
        videoFile = generatedList[0].video || generatedList[0];
      } else if (response.video) {
        videoFile = response.video;
      }

      if (!videoFile) {
        console.error("❌ [Veo] No video in operation response:", response);
        throw new Error("Veo did not return a generated video");
      }

      // Prefer the provided downloadUri, fall back to files.get if needed.
      let downloadUri = videoFile.downloadUri || videoFile.download_uri || "";
      let fileUri = videoFile.uri || videoFile.name || "";

      if (!downloadUri && fileUri) {
        const fileMetaResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(
            fileUri,
          )}`,
          {
            headers: {
              "x-goog-api-key": geminiApiKey,
            },
          },
        );

        const fileMetaText = await fileMetaResp.text();
        if (!fileMetaResp.ok) {
          console.error("❌ [Veo] files.get failed:", fileMetaResp.status, fileMetaText);
          throw new Error("Failed to fetch Veo video file metadata");
        }

        let fileMeta;
        try {
          fileMeta = JSON.parse(fileMetaText);
        } catch (e) {
          throw new Error("Invalid Veo file metadata response");
        }

        downloadUri = fileMeta.downloadUri || fileMeta.download_uri || "";
      }

      if (!downloadUri) {
        throw new Error("Veo video has no download URI");
      }

      console.log("📥 [Veo] Downloading generated video from:", downloadUri);
      const videoBuffer = await downloadGeminiFileToBuffer(downloadUri);

      const segmentFileName = `veo-segment-${Date.now()}-${index}.mp4`;
      const segmentPath = makeTempFilePath(segmentFileName);
      fs.writeFileSync(segmentPath, videoBuffer);
      segmentPaths.push(segmentPath);
      generatedTempFiles.push(segmentPath);

      return;
    }

    throw new Error("Veo operation timed out before completion");
  };

  // Generate each segment sequentially
  for (let i = 0; i < segmentDurations.length; i++) {
    await runVeoSegment(segmentDurations[i], i);
  }

  // If only one segment, upload it directly.
  let finalOutputPath = segmentPaths[0];

  if (segmentPaths.length > 1) {
    const baseNameList = segmentPaths.map((p, idx) => {
      const name = p.split("/").pop() || `veo-segment-${idx}.mp4`;
      return name;
    });

    const listFileName = `veo-concat-${Date.now()}.txt`;
    const listFilePath = makeTempFilePath(listFileName);
    const listContent = segmentPaths.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listFilePath, listContent);
    generatedTempFiles.push(listFilePath);

    const concatenatedPath = makeTempFilePath(`veo-final-${Date.now()}.mp4`);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .output(concatenatedPath)
        .on("end", () => {
          console.log("✅ [Veo] Concatenated Veo segments into final video");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ [Veo] Error concatenating segments:", err);
          reject(err);
        })
        .run();
    });

    finalOutputPath = concatenatedPath;
    generatedTempFiles.push(concatenatedPath);
  }

  // Clean up only intermediate segment files; keep the final output
  // so the caller can merge audio and upload as needed.
  generatedTempFiles.forEach((p) => {
    if (p !== finalOutputPath) {
      fs.unlink(p, () => {});
    }
  });

  return {
    localPath: finalOutputPath,
    durationSeconds: totalSec,
  };
};

// 🔌 OPTIONAL AI TRANSFORM FOR MEDIA FLOW
// This is where we will later plug in an external
// AI provider that uses both the prompt and the
// uploaded images/video to generate a new clip.
//
// For now it is a no-op that just returns the
// original video path so the flow is complete
// even without a real API key.
const transformVideoWithPrompt = async (inputPath, prompt, duration, frame) => {
  if (!inputPath) return inputPath;

  const safePrompt = String(prompt || "").trim();
  if (!safePrompt) {
    return inputPath;
  }

  // MOCK / PLACEHOLDER BEHAVIOR
  if (USE_MOCK_API) {
    console.log("🎨 [API-MEDIA] Mock AI transform (prompt only):", safePrompt);
    console.log("🎨 [API-MEDIA] Duration:", duration, "seconds, frame:", frame || "16:9");
    // In mock mode we just keep the ffmpeg output.
    return inputPath;
  }

  // REAL AI INTEGRATION WILL GO HERE.
  if (!geminiApiKey) {
    console.warn("⚠️ [API-MEDIA] GEMINI_API_KEY is not set – returning base video.");
    return inputPath;
  }

  try {
    const summaryPrompt = [
      "You are assisting an AI video pipeline.",
      "We already rendered a base video from user-uploaded images or clips using ffmpeg.",
      "The user prompt is:",
      safePrompt,
      "Duration (seconds):",
      String(duration || 0),
      "Aspect ratio:",
      frame || "16:9",
      "Return a short textual description of how the final video should look.",
    ].join(" ");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelId}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: summaryPrompt }],
          },
        ],
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.warn("⚠️ [API-MEDIA] Gemini call failed:", response.status, text);
    } else {
      console.log("🧠 [API-MEDIA] Gemini understanding response:", text.slice(0, 500));
    }
  } catch (error) {
    console.error("❌ [API-MEDIA] Error calling Gemini API:", error?.message || error);
  }

  // For now we keep the ffmpeg-generated video as the final output.
  return inputPath;
};

const buildAtempoChain = (speed) => {
  const factors = [];
  let remaining = speed;

  while (remaining < 0.5) {
    factors.push(0.5);
    remaining /= 0.5;
  }
  while (remaining > 2.0) {
    factors.push(2.0);
    remaining /= 2.0;
  }

  factors.push(Math.max(0.5, Math.min(2.0, remaining)));
  return factors.map((f) => `atempo=${f.toFixed(3)}`).join(",");
};

const hasAudioStream = (inputPath) => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        resolve(false);
        return;
      }
      const streams = Array.isArray(metadata?.streams) ? metadata.streams : [];
      resolve(streams.some((s) => s?.codec_type === "audio"));
    });
  });
};

const applyEditorAdjustments = async (inputPath, editorSelections) => {
  if (!inputPath || !editorSelections || typeof editorSelections !== "object") {
    return inputPath;
  }

  const trim = editorSelections?.trim || {};
  const speed = editorSelections?.speed || {};
  const rotate = editorSelections?.rotate || {};
  const volume = editorSelections?.volume || {};
  const zoom = editorSelections?.zoom || {};
  const crop = editorSelections?.crop || {};
  const keyframe = editorSelections?.keyframe || {};

  const trimEnabled = Boolean(trim?.enabled);
  const speedEnabled = Boolean(speed?.enabled);
  const rotateEnabled = Boolean(rotate?.enabled);
  const zoomEnabled = Boolean(zoom?.enabled);
  const cropEnabled = Boolean(crop?.enabled);
  const keyframeEnabled = Boolean(keyframe?.enabled);

  const speedValue = Math.max(0.1, Math.min(3, Number(speed?.value) || 1));
  const rotateDegreesRaw = Number(rotate?.degrees);
  const rotateDegrees = Number.isFinite(rotateDegreesRaw)
    ? ((Math.round(rotateDegreesRaw) % 360) + 360) % 360
    : 0;
  const muted = Boolean(volume?.muted);
  const volumeLevel = Math.max(0, Math.min(2, Number(volume?.level) || 1));
  const zoomAmount = Math.max(1, Math.min(3, Number(zoom?.amount) || 1));
  const cropWidthPct = Math.max(10, Math.min(100, Number(crop?.widthPct) || 100));
  const cropHeightPct = Math.max(10, Math.min(100, Number(crop?.heightPct) || 100));
  const cropCenterX = Math.max(0, Math.min(100, Number(crop?.centerX) || 50));
  const cropCenterY = Math.max(0, Math.min(100, Number(crop?.centerY) || 50));
  const keyframeMode = String(keyframe?.mode || "none");
  const keyframeAmount = Math.max(1.05, Math.min(1.8, Number(keyframe?.amount) || 1.25));

  const start = Math.max(0, Number(trim?.start) || 0);
  const endRaw = trim?.end == null ? null : Number(trim?.end);
  const end = Number.isFinite(endRaw) ? Math.max(start + 0.01, endRaw) : null;
  const duration = end != null ? Math.max(0.01, end - start) : null;
  const hasPerClipTrim = Boolean(trim?.clipRanges && Object.keys(trim.clipRanges || {}).length > 0);

  const needsTrim = !hasPerClipTrim && trimEnabled && (start > 0 || duration != null);
  const needsSpeed = speedEnabled && Math.abs(speedValue - 1) > 0.001;
  const needsRotate = rotateEnabled && rotateDegrees !== 0;
  const needsVolume = muted || Math.abs(volumeLevel - 1) > 0.001;
  const needsZoom = zoomEnabled && zoomAmount > 1.001;
  const needsCrop =
    cropEnabled &&
    (cropWidthPct < 99.99 || cropHeightPct < 99.99 || Math.abs(cropCenterX - 50) > 0.01 || Math.abs(cropCenterY - 50) > 0.01);
  const needsKeyframe = keyframeEnabled && keyframeMode !== "none";

  if (!needsTrim && !needsSpeed && !needsRotate && !needsVolume && !needsZoom && !needsCrop && !needsKeyframe) {
    return inputPath;
  }

  const outputPath = makeTempFilePath("editor-adjusted.mp4");
  const videoFilters = [];
  const audioFilters = [];

  if (needsSpeed) {
    const stretch = 1 / speedValue;
    videoFilters.push(`setpts=${stretch.toFixed(5)}*PTS`);
    audioFilters.push(buildAtempoChain(speedValue));
  }

  if (needsRotate) {
    if (rotateDegrees === 90) {
      videoFilters.push("transpose=1");
    } else if (rotateDegrees === 180) {
      videoFilters.push("transpose=1,transpose=1");
    } else if (rotateDegrees === 270) {
      videoFilters.push("transpose=2");
    }
  }

  if (needsCrop) {
    const xPct = Math.max(0, Math.min(100 - cropWidthPct, cropCenterX - cropWidthPct / 2));
    const yPct = Math.max(0, Math.min(100 - cropHeightPct, cropCenterY - cropHeightPct / 2));
    videoFilters.push(
      `crop=iw*${(cropWidthPct / 100).toFixed(4)}:ih*${(cropHeightPct / 100).toFixed(4)}:iw*${(xPct / 100).toFixed(4)}:ih*${(yPct / 100).toFixed(4)}`,
    );
  }

  if (needsZoom) {
    videoFilters.push(
      `scale=iw*${zoomAmount.toFixed(4)}:ih*${zoomAmount.toFixed(4)},crop=iw/${zoomAmount.toFixed(4)}:ih/${zoomAmount.toFixed(4)}`,
    );
  }

  if (needsKeyframe) {
    const animDuration = Math.max(0.1, Number(duration) || 10);
    let zoomExpr = "1";
    if (keyframeMode === "zoom-in") {
      zoomExpr = `1+${(keyframeAmount - 1).toFixed(4)}*(t/${animDuration.toFixed(4)})`;
    } else if (keyframeMode === "zoom-out") {
      zoomExpr = `${keyframeAmount.toFixed(4)}-${(keyframeAmount - 1).toFixed(4)}*(t/${animDuration.toFixed(4)})`;
    } else if (keyframeMode === "pulse") {
      zoomExpr = `1+${(keyframeAmount - 1).toFixed(4)}*(0.5+0.5*sin(2*PI*t/${animDuration.toFixed(4)}))`;
    }

    videoFilters.push(
      `scale=iw*(${zoomExpr}):ih*(${zoomExpr}),crop=iw/(${zoomExpr}):ih/(${zoomExpr})`,
    );
  }

  if (needsVolume) {
    audioFilters.push(`volume=${muted ? 0 : volumeLevel.toFixed(3)}`);
  }

  const hasAudio = await hasAudioStream(inputPath);
  const safeAudioFilters = hasAudio ? audioFilters : [];

  console.log("🎚️ [API-MEDIA] Applying editor adjustments", {
    trim: {
      enabled: trimEnabled,
      start,
      end,
      duration,
    },
    speed: {
      enabled: speedEnabled,
      value: speedValue,
    },
    rotate: {
      enabled: rotateEnabled,
      degrees: rotateDegrees,
    },
    zoom: {
      enabled: zoomEnabled,
      amount: zoomAmount,
    },
    crop: {
      enabled: cropEnabled,
      centerX: cropCenterX,
      centerY: cropCenterY,
      widthPct: cropWidthPct,
      heightPct: cropHeightPct,
    },
    keyframe: {
      enabled: keyframeEnabled,
      mode: keyframeMode,
      amount: keyframeAmount,
    },
    volume: {
      muted,
      level: volumeLevel,
      hasAudio,
    },
    videoFilters,
    audioFilters: safeAudioFilters,
  });

  await new Promise((resolve, reject) => {
    let command = ffmpeg().input(inputPath);

    if (needsTrim) {
      command = command.setStartTime(start);
      if (duration != null) {
        command = command.setDuration(duration);
      }
    }

    const outputOptions = ["-c:v libx264", "-pix_fmt yuv420p", "-movflags +faststart"];
    if (hasAudio) {
      outputOptions.push("-c:a aac");
    } else {
      outputOptions.push("-an");
    }

    if (videoFilters.length) {
      outputOptions.push("-vf", videoFilters.join(","));
    }

    if (safeAudioFilters.length) {
      outputOptions.push("-af", safeAudioFilters.join(","));
    }

    command
      .outputOptions(outputOptions)
      .output(outputPath)
      .on("end", () => {
        console.log("✅ [API-MEDIA] Editor adjustments rendering complete");
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ [API-MEDIA] Editor adjustments rendering failed:", err);
        reject(err);
      })
      .run();
  });

  return outputPath;
};

const escapeDrawtext = (text = "") => {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
};

const getVideoMetadata = (inputPath) => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        resolve({ width: 1280, height: 720, fps: 30 });
        return;
      }
      const videoStream = metadata?.streams?.find((s) => s.codec_type === "video");
      const width = Number(videoStream?.width || 1280);
      const height = Number(videoStream?.height || 720);
      
      let fps = 30;
      const rFrameRate = videoStream?.r_frame_rate || videoStream?.avg_frame_rate;
      if (rFrameRate) {
        const parts = rFrameRate.split("/");
        if (parts.length === 2) {
          const num = Number(parts[0]);
          const den = Number(parts[1]);
          if (den > 0) {
            fps = Math.round(num / den);
          }
        } else {
          const val = Number(rFrameRate);
          if (Number.isFinite(val) && val > 0) {
            fps = Math.round(val);
          }
        }
      }
      resolve({ width, height, fps: fps || 30 });
    });
  });
};

const applyEffectsToVideo = async (inputPath, effects, durationSeconds = 10) => {
  const selectedEffect = String(effects?.selectedEffect || "none");
  const settings = effects?.settings || {};

  if (!inputPath || selectedEffect === "none") {
    console.log("ℹ️ [API-MEDIA] No deterministic effect applied. selectedEffect=", selectedEffect);
    return inputPath;
  }

  const metadata = await getVideoMetadata(inputPath);

  const outputPath = makeTempFilePath("effect.mp4");
  const videoFilters = [];
  let audioFilter = "";

  const safeDurationForFade = Number.isFinite(Number(durationSeconds)) && Number(durationSeconds) > 0 ? Number(durationSeconds) : 10;
  if (selectedEffect === "fade-in" || selectedEffect === "transition") {
    const fadeDuration = Math.min(4, Math.max(2, safeDurationForFade * 0.4));
    const fadeOutStart = Math.max(0, safeDurationForFade - fadeDuration);
    videoFilters.push(`fade=t=in:st=0:d=${fadeDuration}`);
    videoFilters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeDuration}`);
  }

  if (selectedEffect === "blur") {
    const blur = Math.max(0, Math.min(30, Number(settings.blurAmount) || 10));
    videoFilters.push(`boxblur=${blur}:1`);
  }

  if (selectedEffect === "color-correction") {
    const rawBrightness = Number(settings.brightness);
    const rawContrast = Number(settings.contrast);
    const rawSaturation = Number(settings.saturation);

    const eqBrightness = Math.max(-1, Math.min(1, (Number.isFinite(rawBrightness) ? rawBrightness : 1) - 1));
    const eqContrast = Math.max(0.1, Math.min(3, Number.isFinite(rawContrast) ? rawContrast : 1));
    const eqSaturation = Math.max(0, Math.min(3, Number.isFinite(rawSaturation) ? rawSaturation : 1));

    videoFilters.push(`eq=brightness=${eqBrightness.toFixed(3)}:contrast=${eqContrast.toFixed(3)}:saturation=${eqSaturation.toFixed(3)}`);
  }

  if (selectedEffect === "vintage") {
    // Old-film look: lowered saturation + warm tone curve + temporal grain.
    videoFilters.push("eq=saturation=0.72:contrast=0.93:brightness=0.03");
    videoFilters.push("curves=r='0/0.08 0.60/0.52 1/0.92':g='0/0.06 0.70/0.56 1/0.86':b='0/0.05 0.80/0.52 1/0.76'");
    videoFilters.push("noise=alls=14:allf=t+u");
  }

  if (selectedEffect === "black-white") {
    videoFilters.push("hue=s=0");
  }

  if (selectedEffect === "cinematic") {
    videoFilters.push("eq=contrast=1.4:brightness=0.08:saturation=1.2");
    videoFilters.push("colorbalance=rs=0.08:gs=0.02:bs=-0.08");
  }

  if (selectedEffect === "warm") {
    videoFilters.push("colorbalance=rs=0.12:gs=0.05:bs=-0.10");
    videoFilters.push("eq=saturation=1.1:brightness=0.03");
  }

  if (selectedEffect === "cool") {
    videoFilters.push("colorbalance=rs=-0.10:gs=-0.05:bs=0.14");
    videoFilters.push("eq=saturation=1.05");
  }

  if (selectedEffect === "sepia") {
    videoFilters.push("colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131");
  }

  if (selectedEffect === "hdr") {
    videoFilters.push("eq=contrast=1.6:brightness=0.10:saturation=1.4");
    videoFilters.push("unsharp=5:5:1.1:5:5:0.0");
  }

  if (selectedEffect === "vivid") {
    videoFilters.push("eq=saturation=2.5:contrast=1.3:brightness=0.07");
  }

  if (selectedEffect === "soft-glow") {
    videoFilters.push("gblur=sigma=1.2,eq=brightness=0.08:contrast=1.05");
  }

  if (selectedEffect === "retro-film") {
    videoFilters.push("eq=saturation=0.92:contrast=1.06:brightness=0.02");
    videoFilters.push("colorbalance=rs=-0.03:gs=0.05:bs=-0.08");
    videoFilters.push("noise=alls=10:allf=t+u");
    videoFilters.push("drawgrid=width=iw:height=4:thickness=1:color=black@0.08");
  }

  if (selectedEffect === "slow-motion") {
    const speed = Math.max(0.1, Math.min(1, Number(settings.slowMotionSpeed) || 0.25));
    const stretch = 1 / speed;
    videoFilters.push(`setpts=${stretch.toFixed(3)}*PTS`);
    // Keep as video-speed effect for robustness even when input has no audio stream.
    audioFilter = "";
  }

  if (selectedEffect === "glitch") {
    const intensity = Math.max(0, Math.min(3, Number(settings.glitchIntensity) || 1));
    const noiseLevel = Math.round(10 + intensity * 20);
    videoFilters.push(`noise=alls=${noiseLevel}:allf=t+u`);
  }

  if (selectedEffect === "zoom") {
    videoFilters.push("scale=iw*1.2:ih*1.2,crop=iw/1.2:ih/1.2");
  }

  if (selectedEffect === "green-screen") {
    // Use strong green suppression so the effect is visible even when true chroma scenes are absent.
    videoFilters.push("lutrgb=g='val*0.15'");
  }

  if (selectedEffect === "text-animation") {
    const text = escapeDrawtext(settings.animatedText || "YOUR TEXT HERE");
    videoFilters.push(`drawtext=text='${text}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=64:fontcolor=white:shadowcolor=black@0.8:shadowx=2:shadowy=2:alpha='0.7+0.3*sin(2*PI*t)'`);
  }

  if (selectedEffect === "motion-tracking") {
    // Approximate motion highlight effect with frame-difference style rendering.
    videoFilters.push("tblend=all_mode=difference,eq=contrast=2.0:brightness=0.05:saturation=0");
  }

  // --- NEW EFFECTS ---
  if (selectedEffect === "shake") {
    const strength = Math.max(0, Math.min(10, Number(settings.shakeStrength) || 1.5));
    videoFilters.push(`crop=iw-20:ih-20:10+${strength}*1.5*sin(2*PI*t*8):10+${strength}*1.5*cos(2*PI*t*6.5)`);
  }

  if (selectedEffect === "velocity") {
    const speed = Math.max(0.1, Math.min(5, Number(settings.velocitySpeed) || 1.5));
    const stretch = 1 / speed;
    videoFilters.push(`setpts=${stretch.toFixed(3)}*PTS`);
    audioFilter = "";
  }

  if (selectedEffect === "motion-blur") {
    const frames = Math.max(0, Math.min(25, Number(settings.motionBlurAmount) ?? 8));
    if (frames > 1) {
      videoFilters.push(`tmix=frames=${frames}`);
    }
  }

  if (selectedEffect === "flash-effect") {
    const intensity = Math.max(0.01, Math.min(2.0, Number(settings.flashIntensity) ?? 0.75));
    const br = (0.20 * intensity).toFixed(3);
    const co = (1 + 0.20 * intensity).toFixed(3);
    videoFilters.push(`eq=brightness=${br}:contrast=${co}`);
  }

  if (selectedEffect === "rgb-split") {
    const amount = Math.max(0, Math.min(50, Number(settings.rgbSplitAmount) ?? 12));
    const cbh = Math.round(amount / 3);
    const crh = Math.round(-amount / 3);
    videoFilters.push(`chromashift=cbh=${cbh}:cbv=0:crh=${crh}:crv=0,eq=contrast=1.2:saturation=1.3`);
  }

  if (selectedEffect === "smooth-zoom") {
    const dur = Number(durationSeconds) || 10;
    const amount = Math.max(0.01, Math.min(2.0, Number(settings.smoothZoomAmount) ?? 0.35));
    const zoomScale = (0.12 * (amount / 0.35)).toFixed(4);
    videoFilters.push(`zoompan=z='1+${zoomScale}*sin(PI*on/(${metadata.fps}*${dur}))':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=${metadata.width}x${metadata.height}:fps=${metadata.fps}`);
  }

  if (selectedEffect === "film-grain") {
    const opacity = Math.max(0.01, Math.min(1.0, Number(settings.filmGrainOpacity) ?? 0.4));
    const noiseLevel = Math.round(8 + opacity * 20);
    videoFilters.push(`noise=alls=${noiseLevel}:allf=t+u,eq=contrast=1.05:saturation=1.1`);
  }

  if (selectedEffect === "animated-captions") {
    // No-op or return inputPath, as captions are processed separately.
    console.log("ℹ️ [API-MEDIA] animated-captions placeholder no-op");
  }

  // --- NEW FILTERS ---
  if (selectedEffect === "moody") {
    videoFilters.push("eq=contrast=1.3:brightness=-0.05:saturation=0.75");
  }

  if (selectedEffect === "warm-tone") {
    videoFilters.push("colorbalance=rs=0.10:gs=0.04:bs=-0.08,hue=h=-8,eq=saturation=1.25:brightness=0.03");
  }

  if (selectedEffect === "cool-tone") {
    videoFilters.push("colorbalance=rs=-0.08:gs=-0.03:bs=0.12,hue=h=14,eq=saturation=1.1:brightness=-0.01");
  }

  if (selectedEffect === "teal-orange") {
    videoFilters.push("colorbalance=rs=0.15:gs=0.0:bs=-0.15:rm=0.12:gm=-0.02:bm=-0.12,hue=h=-7,eq=contrast=1.3:saturation=1.25:brightness=0.01");
  }

  if (selectedEffect === "dreamy-glow") {
    videoFilters.push("gblur=sigma=1.0,eq=contrast=0.95:saturation=1.15:brightness=0.03");
  }

  if (selectedEffect === "film-look") {
    videoFilters.push("eq=contrast=1.2:brightness=0.03:saturation=1.15,curves=preset=vintage");
  }

  if (selectedEffect === "vhs") {
    videoFilters.push("chromashift=cbh=2:cbv=1:crh=-2:crv=-1,noise=alls=8:allf=t+u,eq=contrast=1.15:saturation=1.2,hue=h=2");
  }

  if (selectedEffect === "soft-skin") {
    videoFilters.push("smartblur=lr=1.5:ls=-0.5,eq=brightness=0.03:saturation=1.15:contrast=0.95");
  }

  if (selectedEffect === "neon-glow") {
    videoFilters.push("eq=saturation=1.4:brightness=0.03:contrast=1.2,hue=h=10");
  }

  if (selectedEffect === "hdr-pop") {
    videoFilters.push("eq=contrast=1.55:brightness=0.08:saturation=1.45,unsharp=5:5:1.2:5:5:0.0");
  }

  // ─── NEW EFFECTS (Film Grain / Vignette / Soft Glow / RGB Split / Motion Trails / Strobe / Old TV / Scanlines / Zoom Punch) ───

  if (selectedEffect === "vignette") {
    const strength = Math.max(0.1, Math.min(1.0, Number(settings.vignetteStrength) ?? 0.5));
    // angle controls the vignette spread: smaller = stronger vignette. Range: ~0.1 (strong) to 1.2 (light)
    const angle = (1.2 - strength).toFixed(3);
    videoFilters.push(`vignette=angle=${angle}:mode=forward`);
  }

  if (selectedEffect === "motion-trails") {
    const frames = Math.max(2, Math.min(15, Number(settings.motionTrailsFrames) ?? 6));
    const decay = Math.max(0.05, Math.min(0.95, Number(settings.motionTrailsDecay) ?? 0.5));
    // tmix blends multiple frames together, creating a ghosting/trail effect
    videoFilters.push(`tmix=frames=${frames}:weights='${Array.from({length: frames}, (_, i) => (Math.pow(decay, frames - 1 - i)).toFixed(3)).join(' ')}'`);
  }

  if (selectedEffect === "strobe") {
    const rate = Math.max(1, Math.min(30, Number(settings.strobeRate) ?? 8));
    const fps = metadata.fps || 30;
    const skipFrames = Math.max(2, Math.round(fps / rate));
    // tblend difference creates stroboscopic effect by blending frames with offset weights
    // Use equal weights for a frozen-frame look
    const weights = Array.from({length: skipFrames}, (_, i) => i === 0 ? '1' : '0').join(' ');
    videoFilters.push(`tmix=frames=${skipFrames}:weights='${weights}'`);
  }

  if (selectedEffect === "old-tv") {
    // Old TV: scanlines + noise + color shift + vignette
    videoFilters.push("noise=alls=14:allf=t+u");
    videoFilters.push("eq=contrast=1.12:saturation=0.85:brightness=0.02");
    videoFilters.push("chromashift=cbh=3:cbv=2:crh=-3:crv=-2");
    videoFilters.push("vignette=angle=0.6:mode=forward");
    videoFilters.push("hue=h=4");
  }

  if (selectedEffect === "scanlines") {
    const opacity = Math.max(0.02, Math.min(0.6, Number(settings.scanlinesOpacity) ?? 0.25));
    const spacing = Math.max(2, Math.min(8, Math.round(Number(settings.scanlinesSpacing ?? 4))));

    // geq creates repeating scanlines by darkening every Nth row
    const alpha = (1 - opacity).toFixed(3);
    videoFilters.push(`geq=r='r(X,Y)*if(mod(Y\,${spacing}),1,${alpha})':g='g(X,Y)*if(mod(Y\,${spacing}),1,${alpha})':b='b(X,Y)*if(mod(Y\,${spacing}),1,${alpha})'`);
    videoFilters.push("eq=contrast=1.08:brightness=0.02");
  }

  if (selectedEffect === "zoom-punch") {
    const strength = Math.max(0.02, Math.min(0.35, Number(settings.zoomPunchStrength) ?? 0.12));
    const fps = metadata.fps || 30;
    const w = metadata.width || 1280;
    const h = metadata.height || 720;
    // Rhythmic zoom using zoompan — pulses at ~0.5Hz (one pulse per 2 seconds)
    const zoomExpr = `1+${strength.toFixed(3)}*abs(sin(2*3.14159*on/(${fps}*2)))`;
    videoFilters.push(`zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=${w}x${h}:fps=${fps}`);
  }

  if (!videoFilters.length && !audioFilter) {
    console.log("ℹ️ [API-MEDIA] Effect skipped - no filters produced", {
      selectedEffect,
      hasAudioFilter: Boolean(audioFilter),
    });
    return inputPath;
  }

  console.log("🎚️ [API-MEDIA] Effect filter chain", {
    selectedEffect,
    videoFilters,
    audioFilter: audioFilter || "none",
  });

  const hasAudio = await hasAudioStream(inputPath);

  await new Promise((resolve, reject) => {
    let command = ffmpeg().input(inputPath);

    const outputOptions = ["-c:v libx264", "-preset ultrafast", "-crf 22", "-pix_fmt yuv420p", "-movflags +faststart"];
    if (hasAudio) {
      outputOptions.push("-c:a aac");
    } else {
      outputOptions.push("-an");
    }

    if (videoFilters.length) {
      outputOptions.push("-vf", videoFilters.join(","));
    }

    if (hasAudio && audioFilter) {
      outputOptions.push("-af", audioFilter);
    }

    command
      .outputOptions(outputOptions)
      .output(outputPath)
      .on("end", () => {
        console.log("✅ [API-MEDIA] Effect rendering complete:", selectedEffect);
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("❌ [API-MEDIA] Effect rendering failed:", err);
        console.error("📢 [FFmpeg STDERR]:", stderr);
        reject(err);
      })
      .run();
  });

  return outputPath;
};

const applyTextOverlayToVideo = async (inputPath, textOverlay) => {
  const enabled = Boolean(textOverlay?.enabled);
  const text = String(textOverlay?.text || "").trim();

  if (!inputPath || !enabled || !text) {
    return inputPath;
  }

  const size = Math.max(16, Math.min(180, Number(textOverlay?.fontSize) || 48));
  const xPercent = Math.max(0, Math.min(100, Number(textOverlay?.position?.x) || 50));
  const yPercent = Math.max(0, Math.min(100, Number(textOverlay?.position?.y) || 50));
  const color = /^#[0-9a-fA-F]{6,8}$/.test(String(textOverlay?.color || ""))
    ? String(textOverlay.color)
    : "#ffffff";
  const escapedText = escapeDrawtext(text);
  const outputPath = makeTempFilePath("text-overlay.mp4");
  const xExpr = `(w-text_w)*${(xPercent / 100).toFixed(4)}`;
  const yExpr = `(h-text_h)*${(yPercent / 100).toFixed(4)}`;
  const firstFont = String(textOverlay?.fontFamily || "Arial").split(",")[0].trim().replace(/['"]/g, "");
  const drawTextFilter = [
    `drawtext=text='${escapedText}'`,
    `fontsize=${size}`,
    `font='${firstFont}'`,
    `fontcolor=${color}`,
    `x=${xExpr}`,
    `y=${yExpr}`,
    "shadowcolor=black@0.7",
    "shadowx=2",
    "shadowy=2",
  ].join(":");

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .videoFilters([drawTextFilter])
      .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-c:a copy", "-movflags +faststart"])
      .output(outputPath)
      .on("end", () => {
        console.log("✅ [API-MEDIA] Text overlay rendering complete");
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ [API-MEDIA] Text overlay rendering failed:", err);
        reject(err);
      })
      .run();
  });

  return outputPath;
};

const inferEffectFromPrompt = (promptText = "") => {
  const p = String(promptText || "").toLowerCase();
  if (!p) return "none";
  if (p.includes("fade")) return "fade-in";
  if (p.includes("blur")) return "blur";
  if (p.includes("zoom")) return "zoom";
  if (p.includes("black and white") || p.includes("black-white") || p.includes("bw") || p.includes("grayscale")) return "black-white";
  if (p.includes("cinematic") || p.includes("movie look") || p.includes("teal orange")) return "cinematic";
  if (p.includes("warm")) return "warm";
  if (p.includes("cool")) return "cool";
  if (p.includes("sepia")) return "sepia";
  if (p.includes("hdr") || p.includes("high detail") || p.includes("high dynamic")) return "hdr";
  if (p.includes("vivid") || p.includes("super saturated")) return "vivid";
  if (p.includes("soft glow") || p.includes("bloom")) return "soft-glow";
  if (p.includes("retro film") || p.includes("vhs") || p.includes("scanline")) return "retro-film";
  if (p.includes("color") || p.includes("saturation") || p.includes("contrast") || p.includes("brightness")) return "color-correction";
  if (p.includes("vintage") || p.includes("old film")) return "vintage";
  if (p.includes("green screen") || p.includes("chroma")) return "green-screen";
  if (p.includes("slow")) return "slow-motion";
  if (p.includes("glitch")) return "glitch";
  if (p.includes("transition")) return "transition";
  if (p.includes("text")) return "text-animation";
  if (p.includes("motion tracking")) return "motion-tracking";
  return "none";
};

const mapClipTransitionToXfade = (transition = "none") => {
  const t = String(transition || "none").toLowerCase().trim();

  // Dissolve / fade family
  if (t === "fade" || t === "crossfade" || t === "cross-dissolve" || t === "fade-transition") {
    return "dissolve";
  }
  // Dip to black/white
  if (t === "dip-black") return "fade";
  if (t === "dip-white") return "fadewhite";
  // Slides
  if (t === "slide-left" || t === "swipe-transition") return "slideleft";
  if (t === "slide-right") return "slideleft"; // flip via wiperight when possible
  if (t === "wipe") return "wiperight";
  // Zoom / spin
  if (t === "zoom-transition" || t === "zoom") return "zoomin";
  if (t === "spin-transition") return "circlecrop";
  // Blur / glitch / shake
  if (t === "blur-transition") return "smoothleft";
  if (t === "glitch-transition") return "pixelize";
  if (t === "flash-transition") return "fadewhite";
  if (t === "camera-shake-transition") return "hblur";
  if (t === "whip-pan-transition") return "slideleft";
  // Mask / match cut / speed ramp - use dissolve as best ffmpeg match
  if (t === "mask-transition") return "coverleft";
  if (t === "match-cut-transition") return "dissolve";
  if (t === "speed-ramp-transition") return "smoothright";
  // Explicit cut - keep a very brief dissolve for smoothness
  if (t === "none" || t === "") return "fade";

  return "dissolve";  // default fallback
};

// ── Helper: ensure segment has an audio track (add silent track if missing) ──
const ensureAudioStream = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, meta) => {
      const streams = Array.isArray(meta?.streams) ? meta.streams : [];
      const hasAudio = streams.some((s) => s?.codec_type === "audio");
      if (hasAudio) {
        // Already has audio – just copy it through
        ffmpeg(inputPath)
          .outputOptions(["-c copy"])
          .output(outputPath)
          .on("end", () => resolve(outputPath))
          .on("error", (e) => {
            console.warn("⚠️ [AUDIO-ENSURE] copy failed, using original:", e.message);
            resolve(inputPath); // fall back to original
          })
          .run();
      } else {
        // No audio – synthesize a silent track for the same duration
        const duration = Number(meta?.format?.duration || 10);
        const safeDuration = duration > 0 ? duration.toFixed(3) : "10";
        ffmpeg(inputPath)
          .input("anullsrc=cl=stereo:r=44100")
          .inputFormat("lavfi")
          .outputOptions([
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "copy",
            "-c:a", "aac",
            "-t", safeDuration
          ])
          .output(outputPath)
          .on("end", () => resolve(outputPath))
          .on("error", (e) => {
            console.warn("⚠️ [AUDIO-ENSURE] silent-add failed, using original:", e.message);
            resolve(inputPath); // fall back to original
          })
          .run();
      }
    });
  });
};

const mergeSegmentsWithTransitions = async (segmentPaths, transitions, outputPath) => {
  if (!segmentPaths.length) {
    throw new Error("No segments provided for merge");
  }

  // Single segment - just encode it (preserve audio)
  if (segmentPaths.length === 1) {
    console.log("📝 [API-MEDIA] Single segment - direct encoding");
    return new Promise((resolve, reject) => {
      ffmpeg(segmentPaths[0])
        .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-preset fast", "-crf 23", "-c:a aac", "-movflags +faststart"])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ [API-MEDIA] Single segment encoded");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ [API-MEDIA] Encoding failed:", err);
          reject(err);
        })
        .run();
    });
  }

  // Ensure every segment has an audio stream before merging
  console.log("🔊 [MERGE] Ensuring all segments have audio streams...");
  const audioReadyPaths = [];
  for (let i = 0; i < segmentPaths.length; i++) {
    const ap = segmentPaths[i].replace(/\.mp4$/, `-ar${i}.mp4`);
    const result = await ensureAudioStream(segmentPaths[i], ap);
    audioReadyPaths.push(result);
  }

  const cleanupAudioReady = () => {
    audioReadyPaths.forEach((p) => {
      if (p.includes("-ar") && fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch (e) {
          console.warn("⚠️ [MERGE] Failed to cleanup temp audio track:", p, e.message);
        }
      }
    });
  };

  // Multiple segments - check if transitions needed
  // transitions[i] = transition applied to clip i (entering transition from clip i-1 → i)
  const hasTransitions = transitions && transitions.some(t => t && t !== "none");

  console.log("📊 [MERGE] Merge config:", {
    segmentCount: audioReadyPaths.length,
    transitions: transitions,
    hasTransitions: hasTransitions,
  });

  // Target resolution/fps for normalization
  const TARGET_W = 1280;
  const TARGET_H = 720;
  const TARGET_FPS = 30;

  // Build video normalization filter for stream index → [normi]
  const normVFilter = (idx) =>
    `[${idx}:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,` +
    `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2:black,` +
    `setsar=1,fps=${TARGET_FPS}[normv${idx}]`;

  // Build audio normalization filter for stream index → [normai]
  const normAFilter = (idx) =>
    `[${idx}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[norma${idx}]`;

  // ── No transitions: concat with video + audio ─────────────────────────────
  if (!hasTransitions) {
    console.log("🔗 [MERGE] No transitions — using CONCAT with audio");

    return new Promise((resolve, reject) => {
      let cmd = ffmpeg();
      audioReadyPaths.forEach((p) => { cmd = cmd.input(p); });

      const n = audioReadyPaths.length;
      const filters = [];
      for (let i = 0; i < n; i++) {
        filters.push(normVFilter(i));
        filters.push(normAFilter(i));
      }
      const concatInputs = audioReadyPaths.map((_, i) => `[normv${i}][norma${i}]`).join("");
      filters.push(`${concatInputs}concat=n=${n}:v=1:a=1[v][a]`);
      const filterStr = filters.join(";");

      console.log("📝 [MERGE-CONCAT] Filter:", filterStr);

      cmd
        .complexFilter(filterStr)
        .outputOptions([
          "-map", "[v]",
          "-map", "[a]",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-movflags", "+faststart",
        ])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ [MERGE] Concat merge complete (with audio)");
          cleanupAudioReady();
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ [MERGE] Concat merge failed:", err.message);
          cleanupAudioReady();
          reject(err);
        })
        .on("stderr", (line) => {
          if (line.includes("Error") || line.includes("error") || line.includes("Invalid")) {
            console.log("📢 [FFmpeg-CONCAT] stderr:", line);
          }
        })
        .run();
    });
  }

  // ── Has transitions: xfade (video) + acrossfade (audio) ────────────────────
  console.log("🎬 [MERGE] Applying XFADE+ACROSSFADE transitions");

  // Get all segment durations
  const durations = [];
  for (const p of audioReadyPaths) {
    const d = await getVideoDuration(p);
    durations.push(Math.max(1, Number(d) || 3));
  }
  console.log("📊 [MERGE] Segment durations:", durations);

  // Build filter graph:
  //   Phase 1: normalize each stream → [normvI], [normaI]
  //   Phase 2: chain xfade for video and acrossfade for audio in parallel
  const filterParts = [];

  for (let i = 0; i < audioReadyPaths.length; i++) {
    filterParts.push(normVFilter(i));
    filterParts.push(normAFilter(i));
  }

  let currentVLabel = "[normv0]";
  let currentALabel = "[norma0]";
  let accumulatedDuration = durations[0];

  for (let i = 1; i < audioReadyPaths.length; i++) {
    // Check both index i (entering) and i-1 (outgoing) to match whatever mapping is used in the frontend
    const transitionType = (transitions[i] && transitions[i] !== "none")
      ? transitions[i]
      : (transitions[i - 1] || "none");
    const isNone = transitionType === "none" || transitionType === "";
    const xfadeType = mapClipTransitionToXfade(transitionType);

    // Transition duration: 0.04s for cuts, up to 0.8s for real transitions
    const transitionDuration = isNone
      ? 0.04
      : Math.min(0.8, durations[i - 1] * 0.3, durations[i] * 0.3);

    // Video xfade offset
    const offset = Math.max(0.04, accumulatedDuration - transitionDuration - 0.02);

    const nextVLabel = `[xfv${i}]`;
    const nextALabel = `[xfa${i}]`;

    // Video xfade
    filterParts.push(
      `${currentVLabel}[normv${i}]xfade=transition=${xfadeType}:duration=${transitionDuration.toFixed(4)}:offset=${offset.toFixed(4)}${nextVLabel}`
    );
    // Audio crossfade
    filterParts.push(
      `${currentALabel}[norma${i}]acrossfade=d=${transitionDuration.toFixed(4)}${nextALabel}`
    );

    console.log(`  → Clip ${i - 1}→${i}: xfade=${xfadeType} (${transitionType}), dur=${transitionDuration.toFixed(4)}s, offset=${offset.toFixed(4)}s`);

    currentVLabel = nextVLabel;
    currentALabel = nextALabel;
    accumulatedDuration = accumulatedDuration + durations[i] - transitionDuration;
  }

  const fullFilter = filterParts.join(";");
  console.log("📝 [MERGE] Full filter:", fullFilter);
  console.log("📝 [MERGE] Final video label:", currentVLabel, "audio label:", currentALabel);

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg();
    audioReadyPaths.forEach((p) => { cmd = cmd.input(p); });

    cmd
      .complexFilter(fullFilter)
      .outputOptions([
        "-map", currentVLabel,
        "-map", currentALabel,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
      ])
      .output(outputPath)
      .on("end", () => {
        console.log("✅ [MERGE] Xfade+Acrossfade merge complete (with audio)");
        cleanupAudioReady();
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ [MERGE] Xfade merge failed:", err.message);
        cleanupAudioReady();
        reject(err);
      })
      .on("stderr", (line) => {
        if (line.includes("Error") || line.includes("error") || line.includes("Invalid") || line.includes("xfade") || line.includes("acrossfade")) {
          console.log("📢 [FFmpeg-XFADE] stderr:", line);
        }
      })
      .run();
  });
};


/**
 * Generates visual scenes from a text prompt
 * @param {string} prompt - User prompt
 * @returns {Array} Array of 3 scene objects with visual, keywords, duration
 */
const generateScenesFromPrompt = (prompt) => {
  const STOPWORDS = new Set([
    'a','an','the','and','or','of','in','on','at','with','to','for','by','from','is','are','was','were','that','this','these','those','as','it','its','be','being','have','has','had','but','not','into','while','during','my','your','their','its'
  ]);

  // Words to exclude from image search (descriptive, not searchable)
  const EXCLUDE_WORDS = new Set([
    'cinematic', 'realistic', 'lighting', 'ultra', 'detailed', 'quality', 'smooth',
    'volumetric', 'motion', 'dynamic', 'dramatic', 'stunning', 'beautiful', 'amazing',
    'high', 'ray', 'trace', 'render', 'style', 'effect', 'texture', 'ambient'
  ]);

  const extractKeywords = (text) => {
    const words = (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
    const seen = new Set();
    const out = [];
    for (const w of words) {
      if (STOPWORDS.has(w) || EXCLUDE_WORDS.has(w)) continue;
      if (!seen.has(w)) {
        seen.add(w);
        out.push(w);
      }
      if (out.length >= 6) break;
    }
    return out;
  };

  // Extract only 2-3 main keywords for image search
  const extractSearchKeywords = (text, actionWord, locationWord) => {
    const keywords = extractKeywords(text);
    // Prioritize location, action, and main subject
    const mainKeywords = [];
    
    if (locationWord) mainKeywords.push(locationWord);
    if (actionWord) {
      const actionBase = actionWord.replace(/ing$/, '');
      mainKeywords.push(actionBase);
    }
    
    // Add remaining keywords (max 3 total)
    for (const k of keywords) {
      if (!mainKeywords.includes(k) && mainKeywords.length < 3) {
        mainKeywords.push(k);
      }
    }
    
    return mainKeywords.slice(0, 3).join(' ') || 'technology';
  };

  const findAction = (text) => {
    const m = text.match(/\b\w+ing(?: \w+){0,2}\b/i);
    return m ? m[0].toLowerCase() : null;
  };

  const findLocation = (text) => {
    const m = text.match(/(?:in|on|at|inside|within|near) (?:a |an |the )?([\w\s]{1,50})/i);
    if (!m) return null;
    return m[1].split(/[.,;]\s*/)[0].trim().toLowerCase();
  };

  if (!prompt || typeof prompt !== 'string') return [];
  
  const normalized = prompt.trim();
  const action = findAction(normalized);
  const location = findLocation(normalized);
  
  // Generate search-friendly keywords (2-3 main terms)
  const searchKeywords = extractSearchKeywords(normalized, action, location);
  
  // Full keywords for visual descriptions
  const keywordsArr = extractKeywords(normalized);
  const subject = keywordsArr.slice(0, 3).join(' ') || normalized.toLowerCase();

  // Scene 1: main subject performing primary action
  const scene1Visual = action
    ? `${subject} ${action}`
    : location
    ? `${subject} in ${location}`
    : `${subject} in a realistic setting`;

  // Scene 2: interaction or close-up
  const actorHints = ['student', 'students', 'people', 'person', 'child', 'children', 'man', 'woman', 'group'];
  const actor = keywordsArr.find(k => actorHints.includes(k));
  const scene2Visual = actor
    ? `${actor} interacting with ${subject}`
    : action
    ? `close-up of ${subject} ${action}`
    : `close-up of ${subject} with natural detail`;

  // Scene 3: wide environment shot
  const scene3Visual = location
    ? `wide view of ${subject} in ${location}`
    : `wide view showing ${subject} within its environment`;

  console.log(`🔍 [Scenes] Generated keywords for image search: "${searchKeywords}"`);

  return [
    { visual: scene1Visual.toLowerCase(), keywords: searchKeywords, duration: 5 },
    { visual: scene2Visual.toLowerCase(), keywords: searchKeywords, duration: 5 },
    { visual: scene3Visual.toLowerCase(), keywords: searchKeywords, duration: 5 }
  ];
};

/**
 * Detects if a prompt contains complex concepts that require AI generation
 * @param {string} prompt - The prompt to check
 * @returns {boolean} True if prompt contains complex keywords
 */
const isComplexPrompt = (prompt) => {
  const complexWords = ["robot", "ai", "futuristic", "cyberpunk", "spaceship", "alien", "android", "drone", "hologram", "neon", "steampunk"];
  const lowerPrompt = String(prompt || "").toLowerCase();
  return complexWords.some(word => lowerPrompt.includes(word));
};

/**
 * Generates an AI image using Stability AI API
 * @param {string} prompt - The image generation prompt
 * @param {string} variant - Optional variant suffix (e.g., "wide shot", "close up")
 * @returns {Promise<string>} Base64 encoded image or URL
 */
const generateAIImage = async (prompt, variant = "") => {
  const stabilityApiKey = readEnv("STABILITY_API_KEY");
  
  console.log(`🎨 [generateAIImage] Called with prompt: "${prompt}", variant: "${variant}"`);
  console.log(`🎨 [generateAIImage] API Key present: ${stabilityApiKey ? "✅ YES" : "❌ NO"}`);
  
  if (!stabilityApiKey) {
    console.warn("⚠️  [AI Image] Stability API key not configured, falling back to Unsplash");
    return null;
  }

  try {
    const fullPrompt = variant ? `${prompt}, ${variant}` : prompt;
    console.log(`🎨 [Stability AI] Generating image for: "${fullPrompt}"`);

    // Create FormData for multipart request
    const formData = new FormData();
    formData.append("prompt", fullPrompt);
    formData.append("output_format", "png");

    console.log(`🎨 [Stability AI] Making request to https://api.stability.ai/v2beta/stable-image/generate/ultra`);

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/ultra",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stabilityApiKey}`,
          "Accept": "application/json"
        },
        body: formData
      }
    );

    console.log(`🎨 [Stability AI] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Stability AI] API error: ${response.status}`, errorText);
      return null;
    }

    // Parse JSON response containing base64 image
    const data = await response.json();
    
    console.log(`🎨 [Stability AI] Response parsed, checking for image field`);
    
    if (!data.image) {
      console.error("❌ [Stability AI] No image in response. Response keys:", Object.keys(data));
      return null;
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(data.image, "base64");
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedPrompt = String(prompt).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
    const filename = `ai-generated/${sanitizedPrompt}-${timestamp}.png`;
    
    console.log(`💾 [Stability AI] Uploading to Supabase Storage: ${filename}`);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("AI_Generated_Video")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: false
      });
    
    if (uploadError) {
      console.error(`❌ [Stability AI] Upload error:`, uploadError);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("AI_Generated_Video")
      .getPublicUrl(filename);
    
    const publicUrl = publicUrlData?.publicUrl;
    
    if (!publicUrl) {
      console.error(`❌ [Stability AI] Failed to get public URL`);
      return null;
    }
    
    console.log(`✅ [Stability AI] Image uploaded successfully`);
    console.log(`   URL: ${publicUrl.substring(0, 80)}...`);
    
    return publicUrl;

  } catch (error) {
    console.error(`❌ [Stability AI] Error:`, toErrorMessage(error));
    return null;
  }
};

/**
 * Converts scenes to image URLs by searching Unsplash or generating with AI
 * @param {Array} scenes - Array of scene objects with keywords
 * @returns {Promise<Array>} Array of video segments with image URLs
 */
const scenesToImages = async (scenes) => {
  const results = [];
  const usedUrls = new Set();
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const query = scene.keywords || "technology";
    
    try {
      console.log(`\n📸 [Image Fetch] Scene ${i + 1}/${scenes.length}`);
      console.log(`   Query: "${query}"`);
      
      let imageUrl = null;
      let source = "unknown";
      
      // Check if prompt is complex and use AI generation if available
      if (isComplexPrompt(query)) {
        console.log(`🤖 [Image Fetch] Complex prompt detected, attempting AI generation...`);
        
        // Try to generate AI image with different variants for variety
        const variants = ["", "cinematic lighting", "wide shot"];
        const variant = variants[i % variants.length] || "";
        
        const aiImage = await generateAIImage(query, variant);
        if (aiImage) {
          imageUrl = aiImage;
          source = "stability-ai";
          console.log(`✅ [Image Fetch] Using AI-generated image`);
        } else {
          console.log(`⚠️  [Image Fetch] AI generation failed, falling back to Unsplash`);
        }
      }
      
      // Fallback to Unsplash if no AI image
      if (!imageUrl) {
        const searchResponse = await fetch("http://localhost:5000/search-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() })
        });

        if (!searchResponse.ok) {
          throw new Error(`Search failed: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        imageUrl = searchData.image;
        source = searchData.source || "unsplash";
      }

      // Check for duplicates and retry with modified query if needed
      if (usedUrls.has(imageUrl)) {
        console.log(`⚠️  [Image Fetch] Duplicate URL detected, retrying with modified query...`);
        
        // Try with a slightly different query
        const modifiedQuery = `${query} -${i}`;
        const retryResponse = await fetch("http://localhost:5000/search-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: modifiedQuery })
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          imageUrl = retryData.image;
          source = retryData.source || "unsplash";
          console.log(`✅ [Image Fetch] Got unique image on retry`);
        }
      }

      usedUrls.add(imageUrl);
      
      console.log(`✅ [Image Fetch] URL: ${imageUrl.substring(0, 80)}${imageUrl.length > 80 ? '...' : ''}`);
      console.log(`   Source: ${source}`);

      results.push({
        type: "image",
        src: imageUrl,
        duration: scene.duration || 2.8
      });

    } catch (error) {
      console.error(`❌ [Image Fetch] Error for scene ${i + 1}:`, toErrorMessage(error));
      
      // Fallback to picsum
      const fallbackUrl = `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`;
      console.log(`⚠️  [Image Fetch] Using fallback: ${fallbackUrl}`);
      
      results.push({
        type: "image",
        src: fallbackUrl,
        duration: scene.duration || 2.8
      });
    }
  }
  
  console.log(`\n✅ [Image Fetch Complete] Fetched ${results.length} images`);
  return results;
};

/**
 * Builds JSON2Video payload using visual scenes instead of text overlays
 * @param {string} prompt - User prompt
 * @param {number} duration - Video duration in seconds
 * @param {string} aspectRatio - Video aspect ratio
 * @returns {Promise<Object>} JSON2Video API payload
 */
const buildJson2VideoMovie = async (prompt, duration = 10, aspectRatio = "16:9") => {
  const normalizedPrompt = String(prompt || "").trim();
  const safeDuration = Math.max(3, Math.min(180, Number(duration) || 10));
  const ratioMap = {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1440, height: 1080 },
    "3:4": { width: 1080, height: 1440 },
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 1080, height: 1350 },
    "2.35:1": { width: 1920, height: 816 },
  };
  const size = ratioMap[String(aspectRatio || "16:9")] || ratioMap["16:9"];

  // Generate visual scenes from prompt
  const scenes = generateScenesFromPrompt(normalizedPrompt);
  
  // Convert scenes to image elements (async - searches Unsplash)
  const videoSegments = await scenesToImages(scenes);
  
  // Distribute duration across segments
  const durationPerSegment = safeDuration / videoSegments.length;

  console.log("🎬 [Video] Generated scenes from prompt:");
  console.log(`📊 [Video] Total segments: ${videoSegments.length}, Duration per segment: ${durationPerSegment}s`);
  videoSegments.forEach((segment, i) => {
    console.log(`  Image ${i + 1}: ${segment.src}`);
  });

  // Build payload with SEPARATE scenes for each image
  // Each scene has TWO layers: blurred background + main image
  return {
    width: size.width,
    height: size.height,
    quality: "high",
    draft: false,
    scenes: videoSegments.map(segment => ({
      duration: durationPerSegment,
      elements: [
        // Layer 1: Blurred background to fill black edges
        {
          type: "image",
          src: segment.src,
          duration: durationPerSegment,
          resize: "cover",
          blur: 20,
          opacity: 0.5
        },
        // Layer 2: Main image on top
        {
          type: "image",
          src: segment.src,
          duration: durationPerSegment,
          resize: "contain"
        }
      ]
    })),
  };
};

// ✅ JSON2VIDEO API FUNCTION
const generateVideoWithJson2Video = async (prompt, duration = 10, aspectRatio = "16:9") => {
  // MOCK MODE - for testing without valid API key
  if (USE_MOCK_API) {
    console.log("🎬 [MockAPI] Generating mock video...");
    console.log("📝 [MockAPI] Prompt:", prompt);
    console.log("⏱️  [MockAPI] Duration:", duration, "seconds");
    console.log("📐 [MockAPI] Aspect ratio:", aspectRatio);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a mock video URL (placeholder)
    const mockUrl = "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4";
    console.log("✅ [MockAPI] Mock video ready:", mockUrl);
    return mockUrl;
  }

  loadEnvFiles();
  const activeJson2VideoApiKey = readEnv("JSON2VIDEO_API_KEY") || json2VideoApiKey;

  if (!activeJson2VideoApiKey) {
    throw new Error("Missing JSON2VIDEO_API_KEY. Add it to .env.");
  }

  console.log("🎬 [JSON2Video] Starting render...");
  console.log("🔑 [JSON2Video] API Key length:", activeJson2VideoApiKey.length);

  try {
    const requestBody = await buildJson2VideoMovie(prompt, duration, aspectRatio);

    console.log("📝 [JSON2Video] Request body:", JSON.stringify(requestBody));
    console.log("FINAL PAYLOAD:", JSON.stringify(requestBody, null, 2));

    const createResponse = await fetch(`${json2VideoApiUrl}/movies`, {
      method: "POST",
      headers: {
        "x-api-key": activeJson2VideoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const createText = await createResponse.text();
    console.log("📥 [JSON2Video] Create response status:", createResponse.status);
    console.log("📥 [JSON2Video] Create response body:", createText);

    if (!createResponse.ok) {
      throw new Error(`JSON2Video create request failed (${createResponse.status}): ${toErrorMessage(createText)}`);
    }

    let createData = {};
    try {
      createData = JSON.parse(createText || "{}");
    } catch {
      throw new Error("JSON2Video create response returned invalid JSON.");
    }

    console.log("🎬 [JSON2Video] Create response parsed:", createData);

    const projectId =
      createData.project ||
      createData.movie?.project ||
      createData.data?.project;
    if (!projectId) {
      throw new Error("JSON2Video create response missing project id.");
    }

    const taskStatusEndpoint = `${json2VideoApiUrl}/movies?project=${encodeURIComponent(projectId)}`;
    const maxAttempts = 90;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await sleep(5000);

      const statusResponse = await fetch(taskStatusEndpoint, {
        method: "GET",
        headers: {
          "x-api-key": activeJson2VideoApiKey,
        },
      });

      const statusText = await statusResponse.text();
      if (!statusResponse.ok) {
        throw new Error(`JSON2Video status check failed (${statusResponse.status}): ${toErrorMessage(statusText)}`);
      }

      let statusData = {};
      try {
        statusData = JSON.parse(statusText || "{}");
      } catch {
        throw new Error("JSON2Video status response returned invalid JSON.");
      }

      console.log(`📡 [JSON2Video] Status response (${attempt}/${maxAttempts}):`, statusData);

      const movie = statusData.movie || statusData.data?.movie || {};
      const status = String(
        movie.status ||
        statusData.status ||
        statusData.data?.status ||
        "",
      ).toLowerCase();
      const videoUrl =
        statusData.url ||
        movie.url ||
        statusData.data?.url ||
        extractOutputUrl(statusData.output) ||
        extractOutputUrl(movie.output) ||
        extractOutputUrl(statusData.data?.output) ||
        "";

      console.log(`⏳ [JSON2Video] Task status (${attempt}/${maxAttempts}):`, status || "unknown");

      if (status === "completed" || status === "done") {
        if (!videoUrl) {
          console.log("⏳ [JSON2Video] Render marked complete but URL is not ready yet; continuing to poll.");
          continue;
        }
        console.log("✅ [JSON2Video] Video generated:", videoUrl);
        return videoUrl;
      }

      if (status === "failed" || status === "error") {
        const reason =
          movie.message ||
          statusData.message ||
          statusData.error ||
          statusText ||
          "Unknown JSON2Video failure";
        throw new Error(`JSON2Video render failed: ${toErrorMessage(reason)}`);
      }
    }

    throw new Error("JSON2Video render timed out while waiting for result.");
  } catch (error) {
    const message = toErrorMessage(error, "JSON2Video generation failed.");
    console.error("❌ JSON2Video Generation Error:", message);
    throw new Error(message);
  }
};

// ✅ NOVITA TXT2VIDEO FUNCTION (async task API)
const generateVideoWithNovita = async (prompt, duration = 10, aspectRatio = "16:9") => {
  if (!novitaApiKey) {
    throw new Error("Missing NOVITA_API_KEY. Add it to your environment.");
  }
  if (!novitaApiUrl) {
    throw new Error("Missing NOVITA_API_URL. Add it to your environment.");
  }
  if (!novitaModelName) {
    throw new Error("Missing NOVITA_MODEL_NAME. Add it to your environment.");
  }

  const ratioMap = {
    "16:9": { width: 1024, height: 576 },
    "9:16": { width: 576, height: 1024 },
    "1:1": { width: 768, height: 768 },
    "4:3": { width: 960, height: 720 },
    "3:4": { width: 720, height: 960 },
  };

  const mapped = ratioMap[String(aspectRatio || "16:9")] || ratioMap["16:9"];

  // Novita txt2video requires frame-counted prompt segments.
  // We clamp duration to a practical range and map seconds to frames (8-64).
  const clampedSeconds = Math.max(3, Math.min(20, Number(duration) || 10));
  const frames = Math.max(8, Math.min(64, Math.round(clampedSeconds * 3.2)));

  const requestBody = {
    model_name: novitaModelName,
    width: mapped.width,
    height: mapped.height,
    steps: 20,
    seed: -1,
    prompts: [
      {
        frames,
        prompt: String(prompt || "").trim(),
      },
    ],
    negative_prompt:
      "nsfw, low quality, worst quality, blurry, watermark, text, logo",
  };

  console.log("🎬 [Novita] Creating async txt2video task...");
  const createResponse = await fetch(`${novitaApiUrl}/v3/async/txt2video`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${novitaApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const createText = await createResponse.text();
  if (!createResponse.ok) {
    throw new Error(`Novita task creation failed (${createResponse.status}): ${createText}`);
  }

  let createData = {};
  try {
    createData = JSON.parse(createText || "{}");
  } catch {
    throw new Error("Novita task creation returned invalid JSON.");
  }

  const taskId = createData.task_id || createData.taskId || createData?.task?.task_id;
  if (!taskId) {
    throw new Error("Novita response missing task_id.");
  }

  console.log("📝 [Novita] Task created:", taskId);

  const maxAttempts = 90; // ~7.5 minutes @ 5s
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(5000);

    const statusResponse = await fetch(
      `${novitaApiUrl}/v3/async/task-result?task_id=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${novitaApiKey}`,
        },
      },
    );

    const statusText = await statusResponse.text();
    if (!statusResponse.ok) {
      throw new Error(`Novita task polling failed (${statusResponse.status}): ${statusText}`);
    }

    let statusData = {};
    try {
      statusData = JSON.parse(statusText || "{}");
    } catch {
      throw new Error("Novita task polling returned invalid JSON.");
    }

    const status = String(statusData?.task?.status || "").toUpperCase();
    const videoUrl =
      statusData?.videos?.[0]?.video_url ||
      statusData?.videos?.[0]?.url ||
      statusData?.video_url ||
      "";

    console.log(`⏳ [Novita] Task status (${attempt}/${maxAttempts}):`, status || "UNKNOWN");

    if (status.includes("SUCCEED") || status.includes("SUCCESS") || status === "COMPLETED") {
      if (!videoUrl) {
        throw new Error("Novita task succeeded but no video URL was returned.");
      }
      console.log("✅ [Novita] Video generated:", videoUrl);
      return videoUrl;
    }

    if (status.includes("FAIL") || status.includes("ERROR") || status.includes("CANCEL")) {
      const reason = statusData?.task?.reason || "Unknown Novita failure";
      throw new Error(`Novita task failed: ${reason}`);
    }
  }

  throw new Error("Novita task timed out while waiting for result.");
};

const generateVideoWithReplicate = async (prompt, duration = 10, aspectRatio = "16:9") => {
  if (!replicateApiToken) {
    throw new Error("Missing REPLICATE_API_TOKEN. Add it to your environment.");
  }

  const [modelOwner, modelName] = String(replicateModel || "").split("/");
  if (!modelOwner || !modelName) {
    throw new Error("REPLICATE_MODEL must look like owner/name.");
  }

  const safeDuration = Math.max(3, Math.min(12, Number(duration) || 5));
  const safeAspectRatio = String(aspectRatio || "16:9");
  const resolution = safeAspectRatio === "9:16" ? "720p" : "720p";

  console.log("🎬 [Replicate] Starting render...", {
    model: `${modelOwner}/${modelName}`,
    duration: safeDuration,
    aspectRatio: safeAspectRatio,
  });

  const createResponse = await fetch(
    `${replicateApiUrl}/models/${encodeURIComponent(modelOwner)}/${encodeURIComponent(modelName)}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: String(prompt || "").trim(),
          duration: safeDuration,
          aspect_ratio: safeAspectRatio,
          resolution,
          fps: 24,
          camera_fixed: false,
        },
      }),
    },
  );

  const createText = await createResponse.text();
  if (!createResponse.ok) {
    throw new Error(`Replicate create request failed (${createResponse.status}): ${toErrorMessage(createText)}`);
  }

  let prediction = {};
  try {
    prediction = JSON.parse(createText || "{}");
  } catch {
    throw new Error("Replicate create response returned invalid JSON.");
  }

  console.log("📥 [Replicate] Create response:", prediction);

  const predictionId = prediction?.id;
  const predictionUrl = prediction?.urls?.get || (predictionId ? `${replicateApiUrl}/predictions/${encodeURIComponent(predictionId)}` : "");
  if (!predictionUrl) {
    throw new Error("Replicate create response missing prediction URL.");
  }

  const maxAttempts = 90;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(5000);

    const statusResponse = await fetch(predictionUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${replicateApiToken}`,
      },
    });

    const statusText = await statusResponse.text();
    if (!statusResponse.ok) {
      throw new Error(`Replicate status check failed (${statusResponse.status}): ${toErrorMessage(statusText)}`);
    }

    let statusData = {};
    try {
      statusData = JSON.parse(statusText || "{}");
    } catch {
      throw new Error("Replicate status response returned invalid JSON.");
    }

    const status = String(statusData?.status || "").toLowerCase();
    const videoUrl = extractOutputUrl(statusData?.output);

    console.log(`⏳ [Replicate] Task status (${attempt}/${maxAttempts}):`, status || "unknown");

    if (status === "succeeded") {
      if (!videoUrl) {
        throw new Error("Replicate render succeeded but returned no video URL.");
      }
      console.log("✅ [Replicate] Video generated:", videoUrl);
      return videoUrl;
    }

    if (status === "failed" || status === "canceled") {
      throw new Error(`Replicate render failed: ${toErrorMessage(statusData?.error || statusText)}`);
    }
  }

  throw new Error("Replicate render timed out while waiting for result.");
};

const rewritePromptWithOpenRouter = async (prompt, duration = 10, aspectRatio = "16:9") => {
  if (!openRouterApiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Add it to your environment.");
  }

  const requestBody = {
    model: openRouterModel,
    messages: [
      {
        role: "system",
        content:
          "You are a cinematic prompt engineer for text-to-video. Rewrite user prompts into one concise, high-quality production prompt. Keep it under 350 characters, include camera motion, lighting, style cues, and avoid unsafe content. Return only the rewritten prompt text.",
      },
      {
        role: "user",
        content: `Prompt: ${String(prompt || "").trim()}\nDuration: ${Math.max(3, Math.min(180, Number(duration) || 10))}s\nAspect ratio: ${String(aspectRatio || "16:9")}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 220,
  };

  const response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": openRouterSiteUrl,
      "X-Title": openRouterAppName,
    },
    body: JSON.stringify(requestBody),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${raw}`);
  }

  let data = {};
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    throw new Error("OpenRouter returned invalid JSON.");
  }

  const rewritten =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    "";

  const cleaned = String(rewritten || "").trim();
  if (!cleaned) {
    throw new Error("OpenRouter returned an empty prompt.");
  }

  return cleaned;
};

const generateVideoWithOpenRouter = async (prompt, duration = 10, aspectRatio = "16:9") => {
  console.log("🧠 [OpenRouter] Rewriting prompt before generation...");
  const rewrittenPrompt = await rewritePromptWithOpenRouter(prompt, duration, aspectRatio);
  console.log("✅ [OpenRouter] Prompt rewrite complete");

  if (videoProvider === "replicate") {
    return await generateVideoWithReplicate(rewrittenPrompt, duration, aspectRatio);
  }

  return await generateVideoWithJson2Video(rewrittenPrompt, duration, aspectRatio);
};

const buildEffectPromptSnippet = (effects) => {
  if (!effects || effects.selectedEffect === "none") {
    return "";
  }

  const selected = String(effects.selectedEffect || "none");
  const settings = effects.settings || {};

  switch (selected) {
    case "fade-in":
      return "Add a soft fade-in transition at the beginning of the clip.";
    case "blur":
      return `Apply a blur effect with medium strength (${Number(settings.blurAmount) || 10}px feel).`;
    case "zoom":
      return "Apply a progressive cinematic zoom-in from start to end.";
    case "color-correction":
      return `Use color correction with brightness ${Number(settings.brightness) || 1}, contrast ${Number(settings.contrast) || 1}, saturation ${Number(settings.saturation) || 1}.`;
    case "vintage":
      return "Apply a vintage old-film treatment with reduced saturation, warm tones, and subtle grain.";
    case "black-white":
      return "Apply a true black-and-white monochrome grade.";
    case "cinematic":
      return "Apply a cinematic movie look with higher contrast and stylized color separation.";
    case "warm":
      return "Apply a warm color grade with boosted reds/yellows and softer blues.";
    case "cool":
      return "Apply a cool color grade with boosted blue tones and reduced reds.";
    case "sepia":
      return "Apply a sepia old-photo color transformation.";
    case "hdr":
      return "Apply an HDR-like punch with high contrast, brightness, and detail.";
    case "vivid":
      return "Apply a vivid high-saturation color grade.";
    case "soft-glow":
      return "Apply a soft glow bloom effect on highlights.";
    case "retro-film":
      return "Apply a retro VHS film look with grain and scanline texture.";
    case "green-screen":
      return "Apply a chroma key green-screen style where green background is removed.";
    case "slow-motion":
      return `Apply slow-motion pacing around ${(Number(settings.slowMotionSpeed) || 0.25).toFixed(2)}x speed style.`;
    case "glitch":
      return `Add a digital glitch effect with intensity ${Number(settings.glitchIntensity) || 1}.`;
    case "transition":
      return "Use a dissolve transition look from black into the scene.";
    case "text-animation":
      return `Overlay animated center text: \"${String(settings.animatedText || "YOUR TEXT HERE").slice(0, 120)}\".`;
    case "motion-tracking":
      return "Add motion-tracking style highlights that follow movement regions.";
    default:
      return "";
  }
};

// ✅ IMAGE SEARCH ROUTE - Search Unsplash for images
app.post("/search-image", async (req, res) => {
  const { query } = req.body;

  console.log(`\n📍 [/search-image] Endpoint called with query: "${query}"`);

  try {
    if (!query || !String(query).trim()) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    // Check if query contains complex keywords that would benefit from AI generation
    const useAI = isComplexPrompt(query);
    
    console.log(`📍 [/search-image] isComplexPrompt result: ${useAI}`);
    
    if (useAI) {
      console.log(`🤖 [Search] Complex prompt detected, attempting AI generation for: "${query}"`);
      const aiImage = await generateAIImage(query);
      
      console.log(`🤖 [Search] generateAIImage returned: ${aiImage ? "✅ IMAGE" : "❌ NULL"}`);
      
      if (aiImage) {
        return res.json({ 
          success: true, 
          image: aiImage, 
          source: "stability-ai" 
        });
      }
      
      console.log(`⚠️  [Search] AI generation failed, falling back to Unsplash`);
    }
    
    // Try multiple env variable names for the Unsplash API key
    const unsplashAccessKey = process.env.UNSPLASH_API_KEY || process.env.UNSPLASH_ACCESS_KEY;
    
    if (!unsplashAccessKey) {
      console.error("❌ [Unsplash] Missing UNSPLASH_API_KEY environment variable");
      console.error("    Available env vars:", Object.keys(process.env).filter(k => k.includes('UNSPLASH')));
      return res.status(500).json({ 
        success: false, 
        error: "Unsplash API key not configured. Please set UNSPLASH_API_KEY environment variable." 
      });
    }

    console.log(`🔍 [Unsplash] Searching for: "${query}"`);

    // Request multiple results to find a true landscape image
    const searchResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&content_filter=high`,
      {
        method: "GET",
        headers: {
          "Authorization": `Client-ID ${unsplashAccessKey}`,
          "Accept-Version": "v1"
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ [Unsplash] API error: ${searchResponse.status}`, errorText);
      throw new Error(`Unsplash API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      console.warn(`⚠️  [Unsplash] No results found for query: "${query}"`);
      return res.json({
        success: true,
        image: `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`,
        source: "fallback"
      });
    }

    // Filter for true landscape images (width >= height)
    let selectedImage = null;
    for (const result of results) {
      const width = result.width;
      const height = result.height;
      const imageUrl = result.urls?.regular;

      if (!imageUrl) continue;

      // Validate that image is truly landscape (width >= height)
      if (width >= height) {
        console.log(`✅ [Unsplash] Found landscape image (${width}x${height}): "${result.alt_description || query}"`);
        selectedImage = imageUrl;
        break;
      } else {
        console.log(`⏭️  [Unsplash] Skipping portrait image (${width}x${height}), trying next...`);
      }
    }

    if (!selectedImage) {
      console.warn(`⚠️  [Unsplash] No landscape image found for query: "${query}", using fallback`);
      return res.json({
        success: true,
        image: `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`,
        source: "fallback"
      });
    }

    // Append parameters to ensure correct aspect ratio (16:9) and size
    const optimizedImageUrl = `${selectedImage}?w=1280&h=720&fit=crop`;

    console.log(`📸 [Unsplash] Optimized URL: ${optimizedImageUrl}`);
    res.json({ success: true, image: optimizedImageUrl, source: "unsplash" });

  } catch (error) {
    console.error(`❌ [Unsplash] Error:`, toErrorMessage(error));
    
    // Fallback to picsum only if Unsplash completely fails
    const query = req.body.query || "technology";
    const fallbackUrl = `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`;
    console.log(`⚠️  [Fallback] Using picsum: ${fallbackUrl}`);
    
    res.json({
      success: true,
      image: fallbackUrl,
      source: "fallback"
    });
  }
});

// ✅ MAIN ROUTE - API Video Generation
// Accepts JSON with: { prompt, duration, frame }
app.post("/generate", async (req, res) => {
  const { prompt, duration, frame, effects } = req.body;
  const requestStartedAt = Date.now();
  const actor = await getRequestActor(req);
  const { usageLogId, usageContext } = await createUsageLog({
    req,
    actor,
    featureKey: "video.generate",
    creditsRequested: Math.max(1, Math.ceil((Number(duration) || 10) / 10)),
    metadata: {
      frame: frame || "16:9",
      provider: String(req?.body?.provider || videoProvider || "json2video").toLowerCase(),
    },
  });

  try {
    console.log("📍 [API] Video generation request received");

    if (!prompt || !String(prompt).trim()) {
      console.error("❌ [API] Missing prompt");
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    const seconds = Math.max(3, Math.min(180, Number(duration) || 10));
    const effectPromptSnippet = buildEffectPromptSnippet(effects);
    const finalPrompt = [String(prompt || "").trim(), effectPromptSnippet].filter(Boolean).join(" ");
    console.log("Usage context:", usageContext);

    console.log("📝 [API] Generation config: duration=" + seconds + "s, ratio=" + (frame || "16:9"));
    if (effects?.selectedEffect && effects.selectedEffect !== "none") {
      console.log("✨ [API] Requested effect:", effects.selectedEffect);
    }

    // 🔥 STEP 1: GENERATE VIDEO
    const fileName = `output-${Date.now()}.mp4`;
    
    let videoUrl = "";

    const requestedProvider = String(req?.body?.provider || videoProvider || "json2video").toLowerCase();

    console.log("🎬 [API] Starting video generation...");
    if (requestedProvider === "replicate") {
      videoUrl = await generateVideoWithReplicate(finalPrompt, seconds, frame || "16:9");
    } else if (requestedProvider === "novita") {
      videoUrl = await generateVideoWithNovita(finalPrompt, seconds, frame || "16:9");
    } else if (requestedProvider === "openrouter") {
      videoUrl = await generateVideoWithOpenRouter(finalPrompt, seconds, frame || "16:9");
    } else {
      videoUrl = await generateVideoWithJson2Video(finalPrompt, seconds, frame || "16:9");
    }
    console.log("✅ [API] Video generated successfully");

    // 🔥 STEP 2: UPLOAD TO SUPABASE STORAGE
    let storage = null;
    let localPath = null;
    let effectedPath = null;

    try {
      console.log("📤 [API] Uploading to storage...");
      
      if (effects?.selectedEffect && effects.selectedEffect !== "none") {
        try {
          console.log("📥 [API] Downloading generated video to apply effect:", effects.selectedEffect);
          localPath = await downloadRemoteFile(videoUrl, "downloaded-ai-video.mp4");
          
          console.log("🎛️ [API] Applying effect to video...");
          effectedPath = await applyEffectsToVideo(localPath, effects, seconds);
          
          const uploadResult = await uploadToSupabase(
            effectedPath,
            fileName,
            SUPABASE_BUCKETS.AI_GENERATED
          );
          videoUrl = uploadResult.publicUrl;
          storage = uploadResult.storagePath;
        } catch (effectErr) {
          console.warn("⚠️ [API] Failed to apply effect, falling back to original URL upload:", effectErr?.message || effectErr);
          const uploadResult = await uploadVideoUrlToSupabase(
            videoUrl,
            fileName,
            SUPABASE_BUCKETS.AI_GENERATED,
          );
          videoUrl = uploadResult.publicUrl;
          storage = uploadResult.storagePath;
        } finally {
          // Clean up local temp files if they exist
          if (localPath && fs.existsSync(localPath)) {
            try { fs.unlinkSync(localPath); } catch (e) {}
          }
          if (effectedPath && effectedPath !== localPath && fs.existsSync(effectedPath)) {
            try { fs.unlinkSync(effectedPath); } catch (e) {}
          }
        }
      } else {
        const uploadResult = await uploadVideoUrlToSupabase(
          videoUrl,
          fileName,
          SUPABASE_BUCKETS.AI_GENERATED,
        );
        videoUrl = uploadResult.publicUrl;
        storage = uploadResult.storagePath;
      }
      console.log("✅ [API] Storage upload complete");
    } catch (storageError) {
      console.warn("⚠️ [API] Storage upload failed, using direct URL:", storageError?.message || storageError);
    }

    // 🔥 STEP 3: RETURN RESPONSE
    await finalizeUsageLog(
      usageLogId,
      "completed",
      {
        frame: frame || "16:9",
        provider: requestedProvider,
        storage,
        videoUrl,
      },
      0,
    );
    await createApiLog({
      usageLogId,
      endpoint: "/generate",
      requestPayload: {
        prompt: String(prompt || "").slice(0, 200),
        duration: seconds,
        frame: frame || "16:9",
        provider: requestedProvider,
      },
      responsePayload: {
        success: true,
        storage,
      },
      statusCode: 200,
      latencyMs: Date.now() - requestStartedAt,
    });
    res.json({
      success: true,
      video: videoUrl,
      storage,
      usageContext,
    });

  } catch (error) {
    const errorMessage = toErrorMessage(error, "Video generation failed. Please try again.");
    console.error("❌ [API] Error:", errorMessage);
    
    await finalizeUsageLog(usageLogId, "failed", {
      error: errorMessage,
      frame: frame || "16:9",
    });
    await createApiLog({
      usageLogId,
      endpoint: "/generate",
      requestPayload: {
        prompt: String(prompt || "").slice(0, 200),
        duration: Number(duration) || 10,
        frame: frame || "16:9",
      },
      responsePayload: {
        success: false,
        error: errorMessage,
      },
      statusCode: 500,
      latencyMs: Date.now() - requestStartedAt,
    });
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ✅ DIRECT MEDIA-BASED GENERATION (prompt + uploaded pic/video + optional audio)
// Expects multipart/form-data with fields: prompt, duration, frame
// and files: media (one or many images/videos), audio (optional)
app.post(
  "/api/generate-from-media",
  upload.fields([
    { name: "media", maxCount: 20 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        prompt,
        duration,
        frame,
        selectedEffect,
        selectedFilter,
        effectSettings,
        transitionPlan,
        editorSelections,
        quickEditMode,
        speedValue,
        trimEnabled,
        trimStart,
        trimEnd,
        trimClipRanges,
        rotateDegrees,
        volumeMuted,
        volumeLevel,
        zoomEnabled,
        zoomAmount,
        cropEnabled,
        cropCenterX,
        cropCenterY,
        cropWidthPct,
        cropHeightPct,
        keyframeEnabled,
        keyframeMode,
        keyframeAmount,
      } = req.body || {};
      const files = req.files || {};
      const mediaFiles = Array.isArray(files.media) ? files.media : [];
      const audioFiles = Array.isArray(files.audio) ? files.audio : [];
      let parsedEffectSettings = {};
      let parsedTransitionPlan = [];
      let parsedEditorSelections = {};

      try {
        parsedEffectSettings = effectSettings ? JSON.parse(effectSettings) : {};
      } catch (e) {
        parsedEffectSettings = {};
      }

      try {
        parsedTransitionPlan = transitionPlan ? JSON.parse(transitionPlan) : [];
        console.log("✅ [API-MEDIA] Parsed transitionPlan from request:", parsedTransitionPlan);
      } catch (e) {
        console.warn("⚠️  [API-MEDIA] Failed to parse transitionPlan:", e.message);
        parsedTransitionPlan = [];
      }

      try {
        parsedEditorSelections = editorSelections ? JSON.parse(editorSelections) : {};
      } catch (e) {
        parsedEditorSelections = {};
      }

      let parsedTrimClipRanges = {};
      try {
        parsedTrimClipRanges = trimClipRanges ? JSON.parse(trimClipRanges) : {};
      } catch (e) {
        parsedTrimClipRanges = {};
      }

      const resolvedSpeedValue = Math.max(
        0.1,
        Math.min(
          3,
          Number(parsedEditorSelections?.speed?.value ?? speedValue ?? 1) || 1,
        ),
      );

      const resolvedTrim = {
        enabled:
          typeof parsedEditorSelections?.trim?.enabled === "boolean"
            ? parsedEditorSelections.trim.enabled
            : String(trimEnabled || "").toLowerCase() === "true",
        start: Number(parsedEditorSelections?.trim?.start ?? trimStart ?? 0) || 0,
        end:
          parsedEditorSelections?.trim?.end != null
            ? Number(parsedEditorSelections.trim.end)
            : trimEnd === "" || trimEnd == null
            ? null
            : Number(trimEnd),
        clipRanges:
          parsedEditorSelections?.trim?.clipRanges && typeof parsedEditorSelections.trim.clipRanges === "object"
            ? parsedEditorSelections.trim.clipRanges
            : parsedTrimClipRanges,
      };

      const resolvedRotate = {
        enabled:
          typeof parsedEditorSelections?.rotate?.enabled === "boolean"
            ? parsedEditorSelections.rotate.enabled
            : Number(parsedEditorSelections?.rotate?.degrees ?? rotateDegrees ?? 0) % 360 !== 0,
        degrees: Number(parsedEditorSelections?.rotate?.degrees ?? rotateDegrees ?? 0) || 0,
      };

      const resolvedVolume = {
        muted:
          typeof parsedEditorSelections?.volume?.muted === "boolean"
            ? parsedEditorSelections.volume.muted
            : String(volumeMuted || "").toLowerCase() === "true",
        level: Number(parsedEditorSelections?.volume?.level ?? volumeLevel ?? 1) || 1,
      };

      const resolvedZoom = {
        enabled:
          typeof parsedEditorSelections?.zoom?.enabled === "boolean"
            ? parsedEditorSelections.zoom.enabled
            : String(zoomEnabled || "").toLowerCase() === "true",
        amount: Number(parsedEditorSelections?.zoom?.amount ?? zoomAmount ?? 1) || 1,
      };

      const resolvedCrop = {
        enabled:
          typeof parsedEditorSelections?.crop?.enabled === "boolean"
            ? parsedEditorSelections.crop.enabled
            : String(cropEnabled || "").toLowerCase() === "true",
        centerX: Number(parsedEditorSelections?.crop?.centerX ?? cropCenterX ?? 50) || 50,
        centerY: Number(parsedEditorSelections?.crop?.centerY ?? cropCenterY ?? 50) || 50,
        widthPct: Number(parsedEditorSelections?.crop?.widthPct ?? cropWidthPct ?? 100) || 100,
        heightPct: Number(parsedEditorSelections?.crop?.heightPct ?? cropHeightPct ?? 100) || 100,
      };

      const resolvedKeyframe = {
        enabled:
          typeof parsedEditorSelections?.keyframe?.enabled === "boolean"
            ? parsedEditorSelections.keyframe.enabled
            : String(keyframeEnabled || "").toLowerCase() === "true",
        mode: String(parsedEditorSelections?.keyframe?.mode ?? keyframeMode ?? "none"),
        amount: Number(parsedEditorSelections?.keyframe?.amount ?? keyframeAmount ?? 1.25) || 1.25,
        points: Array.isArray(parsedEditorSelections?.keyframe?.points)
          ? parsedEditorSelections.keyframe.points
          : [],
      };

      const resolvedEditorSelections = {
        ...parsedEditorSelections,
        speed: {
          ...(parsedEditorSelections?.speed || {}),
          value: resolvedSpeedValue,
          enabled:
            typeof parsedEditorSelections?.speed?.enabled === "boolean"
              ? parsedEditorSelections.speed.enabled
              : Math.abs(resolvedSpeedValue - 1) > 0.001,
        },
        trim: resolvedTrim,
        rotate: resolvedRotate,
        volume: resolvedVolume,
        zoom: resolvedZoom,
        crop: resolvedCrop,
        keyframe: resolvedKeyframe,
      };

      const selectedEffectFromEditor = parsedEditorSelections?.effect?.selected;
      const inferredEffect = inferEffectFromPrompt(prompt);
      const resolvedSelectedEffect = selectedEffectFromEditor && selectedEffectFromEditor !== "none"
        ? selectedEffectFromEditor
        : selectedEffect && selectedEffect !== "none"
        ? selectedEffect
        : inferredEffect;

      const resolvedEffectSettings =
        parsedEditorSelections?.effect?.settings && Object.keys(parsedEditorSelections.effect.settings).length
          ? parsedEditorSelections.effect.settings
          : parsedEffectSettings;

      const resolvedTransitionPlan = Array.isArray(parsedEditorSelections?.transitions?.transitionPlan)
        ? parsedEditorSelections.transitions.transitionPlan
        : parsedTransitionPlan;

      console.log("🎯 [API-MEDIA] Transition Plan Resolution:", {
        hasEditorSelections: !!parsedEditorSelections,
        hasTransitionsPath: !!parsedEditorSelections?.transitions,
        hasTransitionPlan: !!parsedEditorSelections?.transitions?.transitionPlan,
        editorSelectionsTransitionPlan: parsedEditorSelections?.transitions?.transitionPlan,
        parsedTransitionPlan: parsedTransitionPlan,
        resolvedTransitionPlan: resolvedTransitionPlan,
      });

      const resolvedSelectedFilter =
        parsedEditorSelections?.filters?.selected && parsedEditorSelections.filters.selected !== "none"
          ? String(parsedEditorSelections.filters.selected)
          : selectedFilter && selectedFilter !== "none"
          ? String(selectedFilter)
          : "none";

      const resolvedTextOverlay = parsedEditorSelections?.textOverlay || { enabled: false };

      const selectedFontLabel = resolvedTextOverlay?.fontFamily || resolvedTextOverlay?.fontId || "none";
      const transitionSummary = Array.isArray(resolvedTransitionPlan)
        ? resolvedTransitionPlan
            .map((row) => `#${Number(row?.index) || 0}:${String(row?.transition || "none")}`)
            .join(", ")
        : "";

      const requestedTool = String(req.body?.tool || req.body?.flow || "").toLowerCase();
      const flowHeader = String(req.get("x-vireonix-flow") || "").toLowerCase();
      const isQuickEditMode =
        String(quickEditMode || "").toLowerCase() === "true" ||
        requestedTool === "quick-edit" ||
        flowHeader === "quick-edit";

      // Log transition details for debugging
      console.log("📋 [API-MEDIA] Transition Plan Debug:", {
        transitionPlanRaw: transitionPlan,
        parsedTransitionPlan: parsedTransitionPlan,
        resolvedTransitionPlan: resolvedTransitionPlan,
        transitionSummary: transitionSummary,
        mediaFilesCount: mediaFiles.length,
        isQuickEditMode: isQuickEditMode,
      });

      const effects = {
        selectedEffect: resolvedSelectedEffect || "none",
        settings: resolvedEffectSettings,
      };

      console.log("📍 [API-MEDIA] Direct media generation request received");

      if (!prompt || !String(prompt).trim()) {
        console.error("❌ [API-MEDIA] Missing prompt");
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      if (!mediaFiles.length) {
        console.error("❌ [API-MEDIA] No media files uploaded");
        return res.status(400).json({ success: false, error: "At least one image or video file is required" });
      }

      let seconds = Math.max(3, Math.min(180, Number(duration) || 10));
      const aspect = frame || "16:9";

      // Pick media source and determine storage bucket before any logging/processing.
      const videoFile = mediaFiles.find((f) => f.mimetype?.startsWith("video/"));
      const imageFiles = mediaFiles.filter((f) => f.mimetype?.startsWith("image/"));
      const outputBucket = isQuickEditMode
        ? SUPABASE_BUCKETS.QUICK_EDITS
        : !videoFile && imageFiles.length > 0
        ? SUPABASE_BUCKETS.IMAGE_TO_VIDEO
        : SUPABASE_BUCKETS.AI_GENERATED;

      console.log("📝 [API-MEDIA] Config:", {
        prompt,
        durationSeconds: seconds,
        frame: aspect,
        mediaCount: mediaFiles.length,
        hasAudio: audioFiles.length > 0,
        quickEditMode: isQuickEditMode,
        requestedTool,
        flowHeader,
        outputBucket,
        selectedEffectIncoming: selectedEffect || "none",
        selectedFilterIncoming: selectedFilter || "none",
        selectedEffectFromEditor: selectedEffectFromEditor || "none",
        selectedEffectResolved: effects.selectedEffect,
        selectedFilterResolved: resolvedSelectedFilter,
      });

      console.log("🛠️ [API-MEDIA] Editor selections:", {
        effect: {
          selected: parsedEditorSelections?.effect?.selected || "none",
          enabled: Boolean(parsedEditorSelections?.effect?.enabled),
          settings: parsedEditorSelections?.effect?.settings || {},
        },
        transitions: {
          transitionPlan: parsedEditorSelections?.transitions?.transitionPlan || parsedTransitionPlan,
          clipTransitions: parsedEditorSelections?.transitions?.clipTransitions || {},
        },
        filters: parsedEditorSelections?.filters || { enabled: false },
        speed: resolvedEditorSelections?.speed || { enabled: false },
        trim: resolvedEditorSelections?.trim || { enabled: false },
        textOverlay: parsedEditorSelections?.textOverlay || { enabled: false },
        rotate: resolvedEditorSelections?.rotate || { enabled: false },
        volume: resolvedEditorSelections?.volume || { muted: false, level: 1 },
        zoom: resolvedEditorSelections?.zoom || { enabled: false, mode: "in", amount: 1 },
        crop: resolvedEditorSelections?.crop || { enabled: false, widthPct: 100, heightPct: 100, centerX: 50, centerY: 50 },
        keyframe: resolvedEditorSelections?.keyframe || { enabled: false, mode: "none", amount: 1.25, points: [] },
      });

      console.log("🎯 [API-MEDIA] Selected controls:", {
        effect: effects.selectedEffect || "none",
        filter: resolvedSelectedFilter || "none",
        font: selectedFontLabel,
        speed: resolvedEditorSelections?.speed?.value || 1,
        trim: resolvedEditorSelections?.trim || { enabled: false },
        rotate: resolvedEditorSelections?.rotate || { enabled: false, degrees: 0 },
        volume: resolvedEditorSelections?.volume || { muted: false, level: 1 },
        zoom: resolvedEditorSelections?.zoom || { enabled: false, amount: 1 },
        crop: resolvedEditorSelections?.crop || { enabled: false, widthPct: 100, heightPct: 100 },
        keyframe: resolvedEditorSelections?.keyframe || { enabled: false, mode: "none", amount: 1.25 },
        textEnabled: Boolean(resolvedTextOverlay?.enabled),
        text: String(resolvedTextOverlay?.text || "").slice(0, 80),
        transitions: transitionSummary || "none",
      });

      if (!videoFile && !imageFiles.length) {
        console.error("❌ [API-MEDIA] Unsupported media types");
        return res.status(400).json({ success: false, error: "Upload at least one image or video file" });
      }

      // Store uploaded reference videos in dedicated reference bucket.
      const referenceVideoFiles = mediaFiles.filter((f) => f.mimetype?.startsWith("video/"));
      if (referenceVideoFiles.length > 0) {
        await Promise.allSettled(
          referenceVideoFiles.map(async (file) => {
            try {
              const uploadedRef = await uploadReferenceMediaToSupabase(file.path, file.originalname);
              console.log("📚 [API-MEDIA] Reference video stored:", uploadedRef.storagePath);
            } catch (refErr) {
              console.warn("⚠️ [API-MEDIA] Reference video upload failed:", file.originalname, refErr?.message || refErr);
            }
          }),
        );
      }

      const fileName = `direct-media-${Date.now()}.mp4`;
      const baseOutputPath = makeTempFilePath(fileName);
      let finalOutputPath = baseOutputPath;
      const generatedTempFiles = [];

      // STEP 1: Build base video from uploaded media
      if (isQuickEditMode && mediaFiles.length > 1) {
        console.log("🎞️ [API-MEDIA] Quick Edit multi-clip mode with transitions");
        console.log("📐 [API-MEDIA] Clip trim ranges:", resolvedEditorSelections?.trim?.clipRanges || {});

        const segmentPaths = [];
        
        for (let i = 0; i < mediaFiles.length; i++) {
          const media = mediaFiles[i];
          const segmentPath = makeTempFilePath(`qclip-${i}.mp4`);
          const mediaMeta = resolvedEditorSelections?.media?.items?.[i] || {};
          const mediaId = mediaMeta?.id;
          const rawClipTrim = mediaId ? resolvedEditorSelections?.trim?.clipRanges?.[mediaId] : null;
          const trimStart = Math.max(0, Number(rawClipTrim?.start) || 0);
          const trimEndRaw = rawClipTrim?.end == null ? null : Number(rawClipTrim?.end);
          const trimEnd = Number.isFinite(trimEndRaw) ? Math.max(trimStart + 0.01, trimEndRaw) : null;
          const trimDuration = trimEnd == null ? null : Math.max(0.01, trimEnd - trimStart);

          // Log trim details for this clip
          console.log(`✂️  [API-MEDIA] Clip ${i} (${media.originalname}):`, {
            mediaId: mediaId?.slice(0, 8),
            hasTrim: !!rawClipTrim,
            trimStart: trimStart,
            trimEnd: trimEnd,
            trimDuration: trimDuration?.toFixed(2),
          });

          if (media.mimetype?.startsWith("video/")) {
            await processVideoRange(media.path, segmentPath, trimStart, trimDuration);
          } else if (media.mimetype?.startsWith("image/")) {
            await createVideoFromImage(media.path, segmentPath, 3, aspect);
          }

          let finalSegmentPath = segmentPath;
          const clipEffect = mediaMeta?.effect && mediaMeta.effect !== "none"
            ? mediaMeta.effect
            : (effects?.selectedEffect || "none");
          const clipEffectSettings = mediaMeta?.effectSettings && Object.keys(mediaMeta.effectSettings).length > 0
            ? mediaMeta.effectSettings
            : (effects?.settings || {});

          if (clipEffect && clipEffect !== "none") {
            let clipDuration = trimDuration || Number(mediaMeta?.duration);
            if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
              clipDuration = media.mimetype?.startsWith("image/") ? 3 : await getVideoDuration(segmentPath);
            }
            console.log(`🎬 [API-MEDIA] Applying per-clip effect to segment ${i}:`, {
              effect: clipEffect,
              duration: clipDuration,
            });
            const effectedSegmentPath = await applyEffectsToVideo(
              segmentPath,
              { selectedEffect: clipEffect, settings: clipEffectSettings },
              clipDuration
            );
            if (effectedSegmentPath !== segmentPath) {
              generatedTempFiles.push(effectedSegmentPath);
              finalSegmentPath = effectedSegmentPath;
            }
          }

          const clipFilter = mediaMeta?.filter && mediaMeta.filter !== "none"
            ? mediaMeta.filter
            : (resolvedSelectedFilter || "none");

          if (clipFilter && clipFilter !== "none") {
            let clipDuration = trimDuration || Number(mediaMeta?.duration);
            if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
              clipDuration = media.mimetype?.startsWith("image/") ? 3 : await getVideoDuration(finalSegmentPath);
            }
            console.log(`🎬 [API-MEDIA] Applying per-clip filter to segment ${i}:`, {
              filter: clipFilter,
              duration: clipDuration,
            });
            const filteredSegmentPath = await applyEffectsToVideo(
              finalSegmentPath,
              { selectedEffect: clipFilter, settings: clipEffectSettings },
              clipDuration
            );
            if (filteredSegmentPath !== finalSegmentPath) {
              generatedTempFiles.push(filteredSegmentPath);
              finalSegmentPath = filteredSegmentPath;
            }
          }

          segmentPaths.push(finalSegmentPath);
          generatedTempFiles.push(segmentPath);
        }

        // Log segment paths for merge verification
        console.log("📹 [API-MEDIA] Processed segments ready for merge:", {
          count: segmentPaths.length,
          paths: segmentPaths.map((p, i) => `${i}: ${p.split('/').pop()}`),
        });

        const transitionsByIndex = mediaFiles.map((_, index) => {
          // First try to find by index in resolvedTransitionPlan
          const row = resolvedTransitionPlan.find((p) => Number(p.index) === index);
          const transition = row?.transition || "none";
          
          console.log(`  [Transition] Clip ${index}: resolvedTransitionPlan entry =`, row, "→ transition =", transition);
          
          return transition;
        });

        console.log("🎞️ [API-MEDIA] Multi-clip transitions DEBUG:", {
          resolvedTransitionPlanType: typeof resolvedTransitionPlan,
          resolvedTransitionPlanIsArray: Array.isArray(resolvedTransitionPlan),
          resolvedTransitionPlanLength: resolvedTransitionPlan?.length,
          resolvedTransitionPlanContent: resolvedTransitionPlan,
          mediaFileCount: mediaFiles.length,
          transitionsByIndex: transitionsByIndex,
        });

        // Verify transitions exist
        const hasAnyTransitions = transitionsByIndex.some(t => t !== "none");
        console.log("🎞️ [API-MEDIA] Transition Check:", {
          hasAnyTransitions,
          transitionsByIndex,
          reasonIfNoTransitions: !hasAnyTransitions ? "All transitions are 'none' - will use concat filter instead" : "Transitions will be applied with xfade",
        });

        // Apply transitions using merge function (handles single and multiple clips)
        console.log("🎬 [API-MEDIA] Processing segments with transitions...", {
          segmentCount: segmentPaths.length,
          transitionsByIndex: transitionsByIndex,
          hasAnyTransitions: hasAnyTransitions,
        });
        await mergeSegmentsWithTransitions(segmentPaths, transitionsByIndex, baseOutputPath);
        console.log("✅ [API-MEDIA] Merge completed with transitions");
        seconds = await getVideoDuration(baseOutputPath);
      } else if (videoFile) {
        console.log("🎬 [API-MEDIA] Using uploaded video as source:", videoFile.originalname);
        const primaryMediaId = resolvedEditorSelections?.media?.items?.[0]?.id;
        const rawPrimaryTrim = primaryMediaId
          ? resolvedEditorSelections?.trim?.clipRanges?.[primaryMediaId]
          : null;
        const primaryTrimStart = Math.max(0, Number(rawPrimaryTrim?.start) || 0);
        const primaryTrimEndRaw = rawPrimaryTrim?.end == null ? null : Number(rawPrimaryTrim?.end);
        const primaryTrimEnd = Number.isFinite(primaryTrimEndRaw)
          ? Math.max(primaryTrimStart + 0.01, primaryTrimEndRaw)
          : null;
        const primaryTrimDuration = primaryTrimEnd == null
          ? null
          : Math.max(0.01, primaryTrimEnd - primaryTrimStart);

        console.log("✂️  [API-MEDIA] Single video trim info:", {
          hasTrim: !!rawPrimaryTrim,
          trimStart: primaryTrimStart,
          trimEnd: primaryTrimEnd,
          trimDuration: primaryTrimDuration?.toFixed(2),
        });

        if (isQuickEditMode) {
          // Preserve full uploaded video for Quick Edit.
          await processVideoRange(videoFile.path, baseOutputPath, primaryTrimStart, primaryTrimDuration);
          seconds = await getVideoDuration(baseOutputPath);

          const primaryMediaMeta = resolvedEditorSelections?.media?.items?.[0] || {};
          const primaryClipEffect = primaryMediaMeta?.effect && primaryMediaMeta.effect !== "none"
            ? primaryMediaMeta.effect
            : (effects?.selectedEffect || "none");
          const primaryClipEffectSettings = primaryMediaMeta?.effectSettings && Object.keys(primaryMediaMeta.effectSettings).length > 0
            ? primaryMediaMeta.effectSettings
            : (effects?.settings || {});

          if (primaryClipEffect && primaryClipEffect !== "none") {
            console.log(`🎬 [API-MEDIA] Applying single video clip effect:`, {
              effect: primaryClipEffect,
              duration: seconds,
            });
            const effectedPath = await applyEffectsToVideo(
              baseOutputPath,
              { selectedEffect: primaryClipEffect, settings: primaryClipEffectSettings },
              seconds
            );
            if (effectedPath !== baseOutputPath) {
              generatedTempFiles.push(effectedPath);
              baseOutputPath = effectedPath;
            }
          }

          const primaryClipFilter = primaryMediaMeta?.filter && primaryMediaMeta.filter !== "none"
            ? primaryMediaMeta.filter
            : (resolvedSelectedFilter || "none");

          if (primaryClipFilter && primaryClipFilter !== "none") {
            console.log(`🎬 [API-MEDIA] Applying single video clip filter:`, {
              filter: primaryClipFilter,
              duration: seconds,
            });
            const filteredPath = await applyEffectsToVideo(
              baseOutputPath,
              { selectedEffect: primaryClipFilter, settings: primaryClipEffectSettings },
              seconds
            );
            if (filteredPath !== baseOutputPath) {
              generatedTempFiles.push(filteredPath);
              baseOutputPath = filteredPath;
            }
          }
        } else {
          await processVideoRange(videoFile.path, baseOutputPath, primaryTrimStart, seconds);
        }
      } else if (imageFiles.length === 1) {
        console.log("🖼️ [API-MEDIA] Using single uploaded image as source:", imageFiles[0].originalname);
        await createVideoFromImage(imageFiles[0].path, baseOutputPath, seconds, aspect);

        if (isQuickEditMode) {
          const primaryMediaMeta = resolvedEditorSelections?.media?.items?.[0] || {};
          const primaryClipEffect = primaryMediaMeta?.effect && primaryMediaMeta.effect !== "none"
            ? primaryMediaMeta.effect
            : (effects?.selectedEffect || "none");
          const primaryClipEffectSettings = primaryMediaMeta?.effectSettings && Object.keys(primaryMediaMeta.effectSettings).length > 0
            ? primaryMediaMeta.effectSettings
            : (effects?.settings || {});

          if (primaryClipEffect && primaryClipEffect !== "none") {
            console.log(`🎬 [API-MEDIA] Applying single image clip effect:`, {
              effect: primaryClipEffect,
              duration: seconds,
            });
            const effectedPath = await applyEffectsToVideo(
              baseOutputPath,
              { selectedEffect: primaryClipEffect, settings: primaryClipEffectSettings },
              seconds
            );
            if (effectedPath !== baseOutputPath) {
              generatedTempFiles.push(effectedPath);
              baseOutputPath = effectedPath;
            }
          }

          const primaryClipFilter = primaryMediaMeta?.filter && primaryMediaMeta.filter !== "none"
            ? primaryMediaMeta.filter
            : (resolvedSelectedFilter || "none");

          if (primaryClipFilter && primaryClipFilter !== "none") {
            console.log(`🎬 [API-MEDIA] Applying single image clip filter:`, {
              filter: primaryClipFilter,
              duration: seconds,
            });
            const filteredPath = await applyEffectsToVideo(
              baseOutputPath,
              { selectedEffect: primaryClipFilter, settings: primaryClipEffectSettings },
              seconds
            );
            if (filteredPath !== baseOutputPath) {
              generatedTempFiles.push(filteredPath);
              baseOutputPath = filteredPath;
            }
          }
        }
      } else if (imageFiles.length > 1) {
        console.log("🖼️ [API-MEDIA] Building slideshow from", imageFiles.length, "images");
        const perImageSeconds = Math.max(1, Math.floor(seconds / imageFiles.length) || 1);

        const segmentPaths = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const segmentPath = makeTempFilePath(`segment-${i}.mp4`);
          await createVideoFromImage(imageFiles[i].path, segmentPath, perImageSeconds, aspect);
          segmentPaths.push(segmentPath);
          generatedTempFiles.push(segmentPath);
        }

        // Apply transitions between image segments
        const transitionsByIndex = imageFiles.map((_, index) => {
          const row = resolvedTransitionPlan.find((p) => Number(p.index) === index);
          return row?.transition || "none";
        });

        console.log("🎞️ [API-MEDIA] Image slideshow transitions:", {
          imageFileCount: imageFiles.length,
          transitionPlanLength: resolvedTransitionPlan?.length,
          transitionsByIndex: transitionsByIndex,
        });

        // Apply transitions if multiple segments
        if (segmentPaths.length > 1) {
          await mergeSegmentsWithTransitions(segmentPaths, transitionsByIndex, baseOutputPath);
        } else if (segmentPaths.length === 1) {
          // Copy single segment to output path
          await new Promise((resolve, reject) => {
            fs.copyFile(segmentPaths[0], baseOutputPath, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
        console.log("✅ [API-MEDIA] Slideshow video created with transitions");
      }

      finalOutputPath = baseOutputPath;

      // STEP 2: If this is an images-only request, try full AI video generation with Veo.
      // We ignore the ffmpeg output and instead generate a new AI video from the images + prompt.
      if (!isQuickEditMode && !videoFile && imageFiles.length > 0) {
        try {
          console.log("🎨 [API-MEDIA] Using Veo for image-only AI video generation");
          const veoResult = await generateVeoVideoFromImages(
            prompt,
            seconds,
            aspect,
            imageFiles,
          );

          let veoOutputPath = veoResult.localPath;

          // Merge audio (if provided) after AI video generation, trimming
          // audio to match the selected video duration. Any failure here
          // should log and fall back to the video without custom audio
          // instead of failing the whole request.
          if (audioFiles.length && veoOutputPath) {
            const audioFile = audioFiles[0];
            try {
              console.log("🎵 [API-MEDIA] Merging custom audio with Veo output:", audioFile.originalname);
              const withAudioPath = await mergeVideoWithTrimmedAudio(veoOutputPath, audioFile.path);
              if (withAudioPath && withAudioPath !== veoOutputPath) {
                generatedTempFiles.push(veoOutputPath);
                veoOutputPath = withAudioPath;
              }
            } catch (audioErr) {
              console.warn("⚠️ [API-MEDIA] Audio merge failed, continuing without custom audio:", audioErr?.message || audioErr);
            }
          }

          // Adjust the generated video to the user-selected frame ratio
          // (e.g., if the API only supports a couple of ratios). If this
          // step fails we still return the unadjusted video.
          try {
            const frameAdjustedPath = await adjustVideoToFrame(veoOutputPath, aspect);
            if (frameAdjustedPath && frameAdjustedPath !== veoOutputPath) {
              generatedTempFiles.push(veoOutputPath);
              veoOutputPath = frameAdjustedPath;
            }
          } catch (frameErr) {
            console.warn("⚠️ [API-MEDIA] Frame adjustment failed, returning original Veo output:", frameErr?.message || frameErr);
          }

          // STEP 2.5: Apply deterministic post-processing effects and filters to Veo output
          if (effects?.selectedEffect && effects.selectedEffect !== "none") {
            console.log("🎛️ [API-MEDIA] Applying post-processing to Veo output", {
              effect: effects.selectedEffect || "none",
              filter: resolvedSelectedFilter,
            });
            const effectedPath = await applyEffectsToVideo(veoOutputPath, effects, seconds);
            if (effectedPath !== veoOutputPath) {
              generatedTempFiles.push(veoOutputPath);
              veoOutputPath = effectedPath;
            }
          }

          if (resolvedSelectedFilter !== "none" && resolvedSelectedFilter !== effects?.selectedEffect) {
            console.log("🎨 [API-MEDIA] Applying dedicated filter pass to Veo output", {
              selectedFilter: resolvedSelectedFilter,
              baseEffect: effects?.selectedEffect || "none",
            });
            const filteredPath = await applyEffectsToVideo(
              veoOutputPath,
              { selectedEffect: resolvedSelectedFilter, settings: resolvedEffectSettings },
              seconds,
            );
            if (filteredPath !== veoOutputPath) {
              generatedTempFiles.push(veoOutputPath);
              veoOutputPath = filteredPath;
            }
          }

          // Upload the final Veo-based video into the IMAGE_TO_VIDEO bucket.
          console.log("📤 [API-MEDIA] Uploading Veo output to storage...");
          const uploadResult = await uploadToSupabase(
            veoOutputPath,
            fileName,
            SUPABASE_BUCKETS.IMAGE_TO_VIDEO,
          );

          // Clean up temporary files (best-effort)
          const tempPathsForVeo = [
            ...mediaFiles.map((f) => f.path),
            ...audioFiles.map((f) => f.path),
            ...generatedTempFiles,
            baseOutputPath !== finalOutputPath ? baseOutputPath : null,
            veoOutputPath,
          ].filter(Boolean);

          tempPathsForVeo.forEach((p) => {
            fs.unlink(p, () => {});
          });

          return res.json({
            success: true,
            video: uploadResult.publicUrl,
            storage: uploadResult.storagePath,
            appliedEffect: effects.selectedEffect || "none",
          });
        } catch (veoError) {
          console.error(
            "❌ [API-MEDIA] Veo generation failed, falling back to ffmpeg output:",
            veoError?.message || veoError,
          );
        }
      }

      // STEP 4: Optional AI transform for non-quick-edit flows only.
      if (!isQuickEditMode) {
        finalOutputPath = await transformVideoWithPrompt(finalOutputPath, prompt, seconds, aspect);
      }

      // STEP 4.05: Apply editor controls (trim/speed/rotate/volume) before effects.
      const adjustedPath = await applyEditorAdjustments(finalOutputPath, resolvedEditorSelections);
      if (adjustedPath !== finalOutputPath) {
        generatedTempFiles.push(finalOutputPath);
        finalOutputPath = adjustedPath;
      }

      // STEP 4.1: Apply deterministic post-processing effects for export output
      if (!isQuickEditMode) {
        console.log("🎛️ [API-MEDIA] Applying export post-processing", {
          effect: effects.selectedEffect || "none",
          filter: resolvedSelectedFilter,
          textOverlay: Boolean(resolvedTextOverlay?.enabled && String(resolvedTextOverlay?.text || "").trim()),
        });

        const effectedPath = await applyEffectsToVideo(finalOutputPath, effects, seconds);
        if (effectedPath !== finalOutputPath) {
          generatedTempFiles.push(finalOutputPath);
          finalOutputPath = effectedPath;
        }

        // Apply selected filter as an additional pass so filter + effect can both appear in exports.
        if (resolvedSelectedFilter !== "none" && resolvedSelectedFilter !== effects.selectedEffect) {
          console.log("🎨 [API-MEDIA] Applying dedicated filter pass", {
            selectedFilter: resolvedSelectedFilter,
            baseEffect: effects.selectedEffect || "none",
          });
          const filteredPath = await applyEffectsToVideo(
            finalOutputPath,
            { selectedEffect: resolvedSelectedFilter, settings: resolvedEffectSettings },
            seconds,
          );
          if (filteredPath !== finalOutputPath) {
            generatedTempFiles.push(finalOutputPath);
            finalOutputPath = filteredPath;
          }
        }
      } else {
        console.log("🎛️ [API-MEDIA] Skipping global export post-processing effect and filter in Quick Edit mode");
      }

      const textOverlayPath = await applyTextOverlayToVideo(finalOutputPath, resolvedTextOverlay);
      if (textOverlayPath !== finalOutputPath) {
        generatedTempFiles.push(finalOutputPath);
        finalOutputPath = textOverlayPath;
      }

      // STEP 4.5: Merge editor audio tracks (extracted/imported) into final video
      if (audioFiles.length > 0) {
        try {
          console.log("🎵 [API-MEDIA] Merging editor audio track into final video:", audioFiles[0].originalname);
          const withAudioPath = await mergeVideoWithTrimmedAudio(finalOutputPath, audioFiles[0].path);
          if (withAudioPath && withAudioPath !== finalOutputPath) {
            generatedTempFiles.push(finalOutputPath);
            finalOutputPath = withAudioPath;
          }
        } catch (audioErr) {
          console.warn("⚠️ [API-MEDIA] Editor audio merge failed, continuing without:", audioErr?.message || audioErr);
        }
      }

      // STEP 5: Upload final video to Supabase storage
      console.log("📤 [API-MEDIA] Uploading final video to storage...");
      const { publicUrl, storagePath } = await uploadToSupabase(finalOutputPath, fileName, outputBucket);
      console.log("✅ [API-MEDIA] Storage upload complete");

      // STEP 6: Clean up temporary files (best-effort)
      const tempPaths = [
        ...mediaFiles.map((f) => f.path),
        ...audioFiles.map((f) => f.path),
        ...generatedTempFiles,
        baseOutputPath !== finalOutputPath ? baseOutputPath : null,
        finalOutputPath,
      ].filter(Boolean);

      tempPaths.forEach((p) => {
        fs.unlink(p, () => {});
      });

      return res.json({
        success: true,
        video: publicUrl,
        storage: storagePath,
        appliedEffect: effects.selectedEffect || "none",
        appliedFilter: resolvedSelectedFilter,
      });
    } catch (error) {
      const message = error?.message || "Media-based video generation failed.";
      console.error("❌ [API-MEDIA] Error:", message);
      return res.status(500).json({ success: false, error: message });
    }
  }
);

// ✅ SCENE AND IMAGE GENERATION ENDPOINT
// Takes { prompt } as input
// Returns { scenes: [...], images: [...] }
app.post("/api/scene-images", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const unsplashAccessKey = readEnv("UNSPLASH_ACCESS_KEY");

    if (!unsplashAccessKey) {
      return res.status(500).json({
        success: false,
        error: "UNSPLASH_ACCESS_KEY is not configured in environment variables. Please set it in .env file.",
      });
    }

    console.log("📍 [SCENES] Generating scenes and images for prompt:", prompt.substring(0, 50));

    const result = await generateScenesWithImages(prompt, unsplashAccessKey);

    console.log("✅ [SCENES] Generated", result.scenes.length, "scenes and", result.images.length, "images");

    res.json({
      success: true,
      scenes: result.scenes,
      images: result.images,
    });
  } catch (error) {
    const errorMessage = toErrorMessage(error, "Scene and image generation failed");
    console.error("❌ [SCENES] Error:", errorMessage);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ✅ VIDEO CREATION FROM IMAGES ENDPOINT
// Takes { images: [...], options: {...} } as input
// Returns { success: true, video: "url_or_path" }
app.post("/api/video-from-images", async (req, res) => {
  const { images, options = {}, userId = null } = req.body;

  try {
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Minimum 2 image URLs required",
      });
    }

    // Validate all URLs
    const validImages = images.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validImages.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Minimum 2 valid image URLs required",
      });
    }

    console.log("📍 [VIDEO-FROM-IMAGES] Creating video from", validImages.length, "images");

    // Prepare output path
    const fileName = `animated-video-${Date.now()}.mp4`;
    const outputPath = makeTempFilePath("video.mp4");

    // Merge user options with defaults
    const videoOptions = {
      width: 1280,
      height: 720,
      fps: 30,
      imageDuration: 3,
      transitionDuration: 0.8,
      enableZoom: true,
      enablePan: true,
      scaleEnd: 1.15,
      ...options,
    };

    // Create video
    const videoPath = await createVideoFromImages(validImages, outputPath, videoOptions);

    console.log("✅ [VIDEO-FROM-IMAGES] Video created successfully");

    // Optional: Upload to Supabase
    let publicUrl = videoPath;
    let storage = null;

    try {
      console.log("📤 [VIDEO-FROM-IMAGES] Uploading to storage...");
      const uploadResult = await uploadVideoUrlToSupabase(
        videoPath,
        fileName,
        SUPABASE_BUCKETS.AI_GENERATED,
      );
      publicUrl = uploadResult.publicUrl;
      storage = uploadResult.storagePath;
      console.log("✅ [VIDEO-FROM-IMAGES] Storage upload complete");

      // Clean up local file after upload
      fs.unlink(videoPath, () => {});
    } catch (storageError) {
      console.warn("⚠️ [VIDEO-FROM-IMAGES] Storage upload skipped, using local path");
    }

    // Log usage if user_id provided
    if (userId) {
      try {
        const duration = (videoOptions.imageDuration + videoOptions.transitionDuration) * validImages.length;
        const creditsCharged = Math.ceil(duration * 0.1); // 0.1 credits per second as example
        
        await supabase.from("usage_logs").insert({
          user_id: userId,
          portal: "user",
          usage_type: "production",
          wallet_type: "user_credits",
          feature_key: "video_from_images",
          credits_requested: creditsCharged,
          credits_charged: creditsCharged,
          status: "completed",
          metadata: {
            imageCount: validImages.length,
            videoDuration: duration,
            fileName: fileName,
          },
        });
        console.log("📊 [VIDEO-FROM-IMAGES] Usage logged for user:", userId);
      } catch (logError) {
        console.warn("⚠️ [VIDEO-FROM-IMAGES] Failed to log usage:", logError.message);
      }
    }

    res.json({
      success: true,
      video: publicUrl,
      storage,
      framesRendered: Math.round(
        (videoOptions.imageDuration + videoOptions.transitionDuration) *
          validImages.length *
          videoOptions.fps,
      ),
      duration: (videoOptions.imageDuration + videoOptions.transitionDuration) * validImages.length,
    });
  } catch (error) {
    const errorMessage = toErrorMessage(error, "Video creation from images failed");
    console.error("❌ [VIDEO-FROM-IMAGES] Error:", errorMessage);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ✅ CINEMATIC VIDEO CREATION ENDPOINT
// Takes { images: [...], options: {...}, userId: "user-uuid" } as input with motion effects
// Returns { success: true, video: "url_or_path" }
app.post("/api/cinematic-video", async (req, res) => {
  const { images, options = {}, userId = null } = req.body;

  try {
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Minimum 2 image URLs required",
      });
    }

    // Validate all URLs
    const validImages = images.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validImages.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Minimum 2 valid image URLs required",
      });
    }

    console.log("📍 [CINEMATIC] Creating cinematic video from", validImages.length, "images with motion effects");

    // Prepare output path
    const fileName = `cinematic-video-${Date.now()}.mp4`;
    const outputPath = makeTempFilePath("video.mp4");

    // Merge user options with defaults
    const videoOptions = {
      width: 1280,
      height: 720,
      fps: 30,
      imageDuration: 3.5,
      transitionDuration: 1,
      scaleStart: 1.0,
      scaleEnd: 1.15,
      enablePan: true,
      enableFade: true,
      ...options,
    };

    // Create cinematic video
    const videoPath = await createCinematicVideo(validImages, outputPath, videoOptions);

    console.log("✅ [CINEMATIC] Cinematic video created successfully");

    // Optional: Upload to Supabase
    let publicUrl = videoPath;
    let storage = null;

    try {
      console.log("📤 [CINEMATIC] Uploading to storage...");
      const uploadResult = await uploadVideoUrlToSupabase(
        videoPath,
        fileName,
        SUPABASE_BUCKETS.AI_GENERATED,
      );
      publicUrl = uploadResult.publicUrl;
      storage = uploadResult.storagePath;
      console.log("✅ [CINEMATIC] Storage upload complete");

      // Clean up local file after upload
      fs.unlink(videoPath, () => {});
    } catch (storageError) {
      console.warn("⚠️ [CINEMATIC] Storage upload skipped, using local path");
    }

    // Log usage if user_id provided
    if (userId) {
      try {
        const duration = (videoOptions.imageDuration + videoOptions.transitionDuration) * validImages.length;
        const creditsCharged = Math.ceil(duration * 0.15); // 0.15 credits per second for cinematic (more expensive)
        
        await supabase.from("usage_logs").insert({
          user_id: userId,
          portal: "user",
          usage_type: "production",
          wallet_type: "user_credits",
          feature_key: "cinematic_video",
          credits_requested: creditsCharged,
          credits_charged: creditsCharged,
          status: "completed",
          metadata: {
            imageCount: validImages.length,
            videoDuration: duration,
            fileName: fileName,
            motionEffects: {
              zoom: `${videoOptions.scaleStart} → ${videoOptions.scaleEnd}`,
              pan: videoOptions.enablePan,
              fade: videoOptions.enableFade,
            },
          },
        });
        console.log("📊 [CINEMATIC] Usage logged for user:", userId);
      } catch (logError) {
        console.warn("⚠️ [CINEMATIC] Failed to log usage:", logError.message);
      }
    }

    res.json({
      success: true,
      video: publicUrl,
      storage,
      motionEffects: {
        zoom: `${videoOptions.scaleStart} → ${videoOptions.scaleEnd}`,
        pan: videoOptions.enablePan ? "enabled" : "disabled",
        fadeTransitions: videoOptions.enableFade ? "enabled" : "disabled",
        fps: videoOptions.fps,
      },
      duration: (videoOptions.imageDuration + videoOptions.transitionDuration) * validImages.length,
    });
  } catch (error) {
    const errorMessage = toErrorMessage(error, "Cinematic video creation failed");
    console.error("❌ [CINEMATIC] Error:", errorMessage);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ✅ AUDIO PROCESSING ENDPOINTS

// ✅ Merge audio with video (with volume and trim options)
app.post("/api/merge-audio", upload.fields([
  { name: "videoPath", maxCount: 1 },
  { name: "videoFile", maxCount: 1 },
  { name: "musicFile", maxCount: 1 },
]), async (req, res) => {
  let downloadedRemoteAudioPath = null;
  let audioPath = null;
  let videoFileToDelete = null;

  try {
    const videoFile = req.files?.videoFile?.[0];
    const videoPathField = req.files?.videoPath?.[0];
    const { volume = 80, startTime = 0, endTime, muteOriginal = "false" } = req.body;
    const musicFile = req.files?.musicFile?.[0];

    const resolvedVideoPath = videoFile?.path || videoPathField?.path || req.body.videoPath;

    // Track if we uploaded a video file to clean it up later
    if (videoFile?.path) {
      videoFileToDelete = videoFile.path;
    } else if (videoPathField?.path) {
      videoFileToDelete = videoPathField.path;
    }

    if (musicFile) {
      audioPath = musicFile.path;
    } else if (req.body.musicUrl) {
      downloadedRemoteAudioPath = await downloadRemoteFile(String(req.body.musicUrl));
      audioPath = downloadedRemoteAudioPath;
    }

    if (!resolvedVideoPath || !audioPath) {
      // If we failed early, clean up video file upload
      if (videoFileToDelete) {
        fs.unlink(videoFileToDelete, () => {});
      }
      if (downloadedRemoteAudioPath) {
        fs.unlink(downloadedRemoteAudioPath, () => {});
      }
      return res.status(400).json({
        success: false,
        error: "Missing video file/path or audio source (musicFile or musicUrl)",
      });
    }

    console.log("🎵 [AUDIO] Merging audio with video", {
      resolvedVideoPath,
      musicFile: musicFile?.filename,
      musicUrl: req.body.musicUrl,
      volume,
      startTime,
      endTime,
      muteOriginal,
    });

    const musicVolume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;
    const shouldMuteOriginal = muteOriginal === "true" || muteOriginal === true;

    // Trim audio if needed
    if (startTime || endTime) {
      const trimmedAudioPath = makeTempFilePath("trimmed-for-merge.mp3");
      const duration = endTime ? Number(endTime) - Number(startTime) : undefined;

      await new Promise((resolve, reject) => {
        let cmd = ffmpeg(audioPath).setStartTime(Number(startTime) || 0);

        if (duration) {
          cmd = cmd.setDuration(duration);
        }

        cmd
          .audioFilters([`volume=${musicVolume}`])
          .output(trimmedAudioPath)
          .on("end", () => resolve())
          .on("error", reject)
          .run();
      });

      // delete untrimmed temp download if we downloaded it
      if (downloadedRemoteAudioPath && audioPath !== downloadedRemoteAudioPath) {
        fs.unlink(downloadedRemoteAudioPath, () => {});
        downloadedRemoteAudioPath = null;
      }
      audioPath = trimmedAudioPath;
    } else if (musicVolume !== 1) {
      // Just adjust volume if no trimming needed
      const volumeAdjustedPath = makeTempFilePath("volume-adjusted.mp3");
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .audioFilters([`volume=${musicVolume}`])
          .output(volumeAdjustedPath)
          .on("end", () => resolve())
          .on("error", reject)
          .run();
      });
      // delete original temp download if we downloaded it
      if (downloadedRemoteAudioPath && audioPath !== downloadedRemoteAudioPath) {
        fs.unlink(downloadedRemoteAudioPath, () => {});
        downloadedRemoteAudioPath = null;
      }
      audioPath = volumeAdjustedPath;
    }

    // Merge video and audio
    const outputPath = makeTempFilePath("merged-video.mp4");

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg()
        .input(resolvedVideoPath)
        .input(audioPath);

      if (shouldMuteOriginal) {
        cmd = cmd.outputOptions(["-map", "0:v", "-map", "1:a"]);
      } else {
        cmd = cmd.outputOptions(["-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first[a]", "-map", "0:v", "-map", "[a]"]);
      }

      cmd
        .outputOptions(["-c:v copy", "-c:a aac"])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ [AUDIO] Audio merged successfully");
          resolve();
        })
        .on("error", reject)
        .run();
    });

    // Stream the result
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "attachment; filename=merged-video.mp4");

    const fileStream = fs.createReadStream(outputPath);
    fileStream.on("end", () => {
      // Cleanup
      fs.unlink(outputPath, () => {});
      fs.unlink(audioPath, () => {});
      if (videoFileToDelete) {
        fs.unlink(videoFileToDelete, () => {});
      }
      if (downloadedRemoteAudioPath) {
        fs.unlink(downloadedRemoteAudioPath, () => {});
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ [AUDIO] Merge error:", error);
    // Cleanup on error
    if (audioPath) {
      fs.unlink(audioPath, () => {});
    }
    if (videoFileToDelete) {
      fs.unlink(videoFileToDelete, () => {});
    }
    if (downloadedRemoteAudioPath) {
      fs.unlink(downloadedRemoteAudioPath, () => {});
    }
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Audio merge failed"),
    });
  }
});

// ✅ Burn captions into video using FFmpeg subtitles
app.post("/api/burn-captions", upload.none(), async (req, res) => {
  try {
    const { videoPath, captions } = req.body;
    if (!videoPath || !captions) {
      return res.status(400).json({
        success: false,
        error: "Missing videoPath or captions",
      });
    }

    const parsedCaptions = typeof captions === "string" ? JSON.parse(captions) : captions;
    if (!Array.isArray(parsedCaptions) || parsedCaptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Captions must be a non-empty array",
      });
    }

    const srtPath = makeTempFilePath("captions.srt");
    await fs.promises.writeFile(srtPath, buildSrt(parsedCaptions), "utf8");

    const outputPath = makeTempFilePath("burned-captions.mp4");
    const subtitleSource = normalizeSubtitlePath(srtPath);
    const subtitleOptions = `subtitles=${subtitleSource}:force_style='FontName=Arial,FontSize=26,PrimaryColour=&HFFFFFF&,BackColour=&H00000080&,OutlineColour=&H00000000&,BorderStyle=3,Outline=2,Shadow=1'`;

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .videoFilters([`subtitles=${subtitleSource}:force_style='FontName=Arial,FontSize=26,PrimaryColour=&HFFFFFF&,BackColour=&H00000080&,OutlineColour=&H00000000&,BorderStyle=3,Outline=2,Shadow=1'`])
        .outputOptions(["-c:v libx264", "-crf 23", "-preset veryfast"])
        .outputOptions(["-c:a copy"])
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "attachment; filename=captioned-video.mp4");

    const fileStream = fs.createReadStream(outputPath);
    fileStream.on("end", () => {
      fs.unlink(outputPath, () => {});
      fs.unlink(srtPath, () => {});
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ [CAPTIONS] Burn error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Burning captions failed"),
    });
  }
});

// ✅ Process audio (trim and adjust volume)
app.post("/api/process-audio", upload.single("audioFile"), async (req, res) => {
  try {
    const { startTime = 0, endTime, volume = 80, format = "mp3" } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided",
      });
    }

    console.log("🎵 [AUDIO] Processing audio", {
      startTime,
      endTime,
      volume,
      format,
    });

    const outputPath = makeTempFilePath(`processed-audio.${format}`);
    const musicVolume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;
    const duration = endTime ? Number(endTime) - Number(startTime) : undefined;

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(audioFile.path)
        .setStartTime(Number(startTime) || 0);

      if (duration) {
        cmd = cmd.setDuration(duration);
      }

      cmd
        .audioFilters([`volume=${musicVolume}`])
        .audioCodec(format === "wav" ? "pcm_s16le" : "libmp3lame")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });

    // Stream the result
    const mimeType = format === "wav" ? "audio/wav" : "audio/mpeg";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=processed-audio.${format}`);

    const fileStream = fs.createReadStream(outputPath);
    fileStream.on("end", () => {
      fs.unlink(outputPath, () => {});
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ [AUDIO] Process error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Audio processing failed"),
    });
  }
});

// ✅ Convert audio format
app.post("/api/convert-audio", upload.single("audioFile"), async (req, res) => {
  try {
    const { format = "mp3" } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided",
      });
    }

    console.log("🎵 [AUDIO] Converting audio to", format);

    const outputPath = makeTempFilePath(`converted-audio.${format}`);
    const codec = format === "wav" ? "pcm_s16le" : format === "aac" ? "aac" : "libmp3lame";

    await new Promise((resolve, reject) => {
      ffmpeg(audioFile.path)
        .audioCodec(codec)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });

    // Stream the result
    const mimeTypes = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      aac: "audio/aac",
    };

    res.setHeader("Content-Type", mimeTypes[format] || "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename=converted-audio.${format}`);

    const fileStream = fs.createReadStream(outputPath);
    fileStream.on("end", () => {
      fs.unlink(outputPath, () => {});
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ [AUDIO] Convert error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Audio conversion failed"),
    });
  }
});

// ✅ GET audio metadata
app.post("/api/audio-metadata", upload.single("audioFile"), async (req, res) => {
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
    console.error("❌ [AUDIO] Metadata error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Failed to get audio metadata"),
    });
  }
});

// ✅ DEVELOPER PORTAL API
app.use(developerPortalAPI);

// ✅ Serve static files from Vite build in production
const distPath = path.resolve(__dirname, "dist");
if (fs.existsSync(distPath)) {
  console.log("📦 Serving static files from:", distPath);
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for any non-API route (Express 5 compatible)
  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path === "/search-image" ||
      req.path === "/generate" ||
      req.path === "/test"
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("⚠️ dist directory not found. Static files not served.");
}

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER LISTENING");
  console.log("SERVER RUNNING");
  console.log(`✅ Server running on port ${PORT}`);
});
