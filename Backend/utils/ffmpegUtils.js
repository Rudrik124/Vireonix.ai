import fs from "fs";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const tempWorkDir = path.join(os.tmpdir(), "aivideoeditor1-temp");
if (!fs.existsSync(tempWorkDir)) {
  fs.mkdirSync(tempWorkDir, { recursive: true });
}

export const makeTempFilePath = (suffix) => {
  const safeSuffix = String(suffix || "temp.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filePath = path.join(tempWorkDir, `${unique}-${safeSuffix}`);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
};

export const downloadRemoteFile = async (remoteUrl, defaultSuffix = "remote.mp3") => {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download remote file: ${response.status} ${response.statusText}`);
  }

  const url = new URL(remoteUrl);
  const ext = path.extname(url.pathname) || defaultSuffix;
  const outputPath = makeTempFilePath(`downloaded-file${ext}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(outputPath, buffer);
  return outputPath;
};

export const buildSrt = (captions) => {
  return captions
    .map((caption, index) => {
      const startHms = new Date(caption.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      const endHms = new Date(caption.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      return `${index + 1}\n${startHms} --> ${endHms}\n${caption.text.replace(/\r?\n/g, ' ')}\n`;
    })
    .join("\n");
};

export const normalizeSubtitlePath = (filePath) => {
  const absolutePath = path.resolve(filePath).replace(/\\/g, "/");
  let normalized = absolutePath;
  if (/^[a-zA-Z]:/.test(normalized)) {
    normalized = normalized.charAt(0) + "\\:" + normalized.substring(2);
  }
  normalized = normalized.replace(/'/g, "\\'");
  return `'${normalized}'`;
};

export const makeLocalAssPath = () => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return path.join(process.cwd(), `temp-captions-${unique}.ass`);
};

export const convertHexToAssColor = (hex) => {
  if (!hex) return "&HFFFFFF";
  let clean = String(hex).trim().replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (clean.length === 6) {
    const rr = clean.substring(0, 2);
    const gg = clean.substring(2, 4);
    const bb = clean.substring(4, 6);
    return `&H00${bb}${gg}${rr}`;
  }
  return "&HFFFFFF";
};

export const convertHexToAssColorWithAlpha = (hex, alphaHex = "00") => {
  if (!hex) return `&H${alphaHex}FFFFFF`;
  let clean = String(hex).trim().replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (clean.length === 6) {
    const rr = clean.substring(0, 2);
    const gg = clean.substring(2, 4);
    const bb = clean.substring(4, 6);
    return `&H${alphaHex}${bb}${gg}${rr}`;
  }
  return `&H${alphaHex}FFFFFF`;
};

export const getVideoDimensions = (videoPath) =>
  new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err || !metadata) {
        console.warn("⚠️ [ASS] Could not probe video dimensions, using 1280x720 fallback:", err?.message);
        return resolve({ width: 1280, height: 720 });
      }
      const vStream = (metadata.streams || []).find((s) => s.codec_type === "video");
      if (!vStream || !vStream.width || !vStream.height) {
        return resolve({ width: 1280, height: 720 });
      }
      resolve({ width: vStream.width, height: vStream.height });
    });
  });

export const buildAss = (captions, style = {}, videoWidth = 1280, videoHeight = 720) => {
  const fontName = String(style.fontFamily || "Arial").split(",")[0].trim().replace(/['"]/g, "");
  const fontSize = style.fontSize || 26;
  const primaryColor = convertHexToAssColor(style.color || "#FFFFFF");
  const backColor = style.bgEnabled 
    ? convertHexToAssColorWithAlpha(style.bgColorHex || "#000000", "00") 
    : "&H40000000";
  const borderStyle = style.bgEnabled ? 3 : 1;
  const bold = style.bold ? -1 : 0;
  const italic = style.italic ? -1 : 0;
  const outline = style.outline ? 2 : (style.bgEnabled ? 2 : 0);
  const shadow = style.bgEnabled ? 0 : 1;
  const alignment = style.alignment === "left" ? 4 : style.alignment === "right" ? 6 : 5;

  const playResY = 360;
  const playResX = Math.round(360 * (videoWidth / videoHeight));

  const posX = style.posX != null ? Number(style.posX) : 50;
  const posY = style.posY != null ? Number(style.posY) : 80;
  const x = Math.round((posX / 100) * playResX);
  const y = Math.round((posY / 100) * playResY);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CaptionStyle,${fontName},${fontSize},${primaryColor},&H00FFFF00,&H00000000,${backColor},${bold},${italic},0,0,100,100,0,0,${borderStyle},${outline},${shadow},${alignment},10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogues = captions.map((caption) => {
    const formatTime = (timeSecs) => {
      const hrs = Math.floor(timeSecs / 3600);
      const mins = Math.floor((timeSecs % 3600) / 60);
      const secs = Math.floor(timeSecs % 60);
      const centisecs = Math.floor((timeSecs % 1) * 100);
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centisecs.toString().padStart(2, "0")}`;
    };

    const start = formatTime(caption.startTime);
    const end = formatTime(caption.endTime);
    const text = caption.text.replace(/\r?\n/g, "\\N");

    return `Dialogue: 0,${start},${end},CaptionStyle,,0,0,0,,{\\pos(${x},${y})}${text}`;
  });

  return [header, ...dialogues].join("\n");
};
