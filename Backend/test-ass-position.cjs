const fs = require('fs');
const path = require('path');

// Mock data simulating the frontend editor selections payload
const editorSelections = {
  captions: [
    { id: "cap1", text: "This is a styled caption.", startTime: 1.0, endTime: 4.5, clipId: "clip-1" }
  ],
  captionStyle: {
    fontId: "sans",
    fontFamily: "Montserrat",
    fontSize: 32,
    color: "#FF5733",
    bgEnabled: true,
    bgColorHex: "#000000",
    alignment: "center",
    bold: true,
    italic: true,
    outline: true,
    posX: 50,
    posY: 85,
  },
  textOverlay: {
    enabled: true,
    text: "Styled Title Overlay",
    stylePreset: "none",
    fontId: "serif",
    fontFamily: "Playfair Display",
    fontSize: 48,
    color: "#33FF57",
    bgEnabled: true,
    bgColorHex: "#111111",
    position: {
      x: 50,
      y: 30
    }
  }
};

// Functions from server.js
const convertHexToAssColor = (hex) => {
  if (!hex || !hex.startsWith("#")) return "&HFFFFFF&";
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const rr = clean.substring(0, 2);
    const gg = clean.substring(2, 4);
    const bb = clean.substring(4, 6);
    return `&H00${bb}${gg}${rr}&`;
  }
  return "&HFFFFFF&";
};

const convertHexToAssColorWithAlpha = (hex, alphaHex = "00") => {
  if (!hex || !hex.startsWith("#")) return `&H${alphaHex}FFFFFF&`;
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const rr = clean.substring(0, 2);
    const gg = clean.substring(2, 4);
    const bb = clean.substring(4, 6);
    return `&H${alphaHex}${bb}${gg}${rr}&`;
  }
  return `&H${alphaHex}FFFFFF&`;
};

const buildAss = (captions, style = {}, videoWidth = 1280, videoHeight = 720) => {
  const fontName = String(style.fontFamily || "Arial").split(",")[0].trim().replace(/['"]/g, "");
  const fontSize = style.fontSize || 26;
  const primaryColor = convertHexToAssColor(style.color || "#FFFFFF");
  const backColor = style.bgEnabled 
    ? convertHexToAssColorWithAlpha(style.bgColorHex || "#000000", "00") 
    : "&H40000000&";
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
Style: CaptionStyle,${fontName},${fontSize},${primaryColor},&H00FFFF00&,&H00000000&,${backColor},${bold},${italic},0,0,100,100,0,0,${borderStyle},${outline},${shadow},${alignment},10,10,10,1

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

// Text overlay resolver
const resolveTextOverlayPreset = (textOverlay) => {
  if (!textOverlay) return null;
  const preset = textOverlay.stylePreset || "none";
  let fontFamily = textOverlay.fontFamily || "Arial";
  let fontSize = Number(textOverlay.fontSize) || 48;
  let color = textOverlay.color || "#ffffff";
  let bgEnabled = Boolean(textOverlay.bgEnabled);
  let bgColorHex = textOverlay.bgColorHex || "#000000";
  let bold = -1;
  let italic = 0;
  let textTransform = "none";
  let alphaHex = "00";

  if (preset === "none" && bgEnabled) {
    alphaHex = "4C";
  }

  fontFamily = String(fontFamily).split(",")[0].trim().replace(/['"]/g, "");

  return {
    enabled: Boolean(textOverlay.enabled),
    text: textTransform === "uppercase" ? String(textOverlay.text || "").toUpperCase() : String(textOverlay.text || ""),
    fontFamily,
    fontSize,
    color,
    bgEnabled,
    bgColorHex,
    alphaHex,
    bold,
    italic,
    preset,
    position: textOverlay.position || { x: 50, y: 50 }
  };
};

const buildTextOverlayAss = (textOverlay, videoWidth = 1280, videoHeight = 720) => {
  const resolved = resolveTextOverlayPreset(textOverlay);
  if (!resolved) return null;

  const primaryColor = convertHexToAssColor(resolved.color);
  const backColor = resolved.bgEnabled
    ? convertHexToAssColorWithAlpha(resolved.bgColorHex, resolved.alphaHex)
    : "&H40000000&";

  let borderStyle = resolved.bgEnabled ? 3 : 1;
  let outline = resolved.bgEnabled ? 2 : 1;
  let shadow = resolved.bgEnabled ? 0 : 1;
  let outlineColor = "&H00000000&";

  const fontName = resolved.fontFamily;
  const playResY = 360;
  const playResX = Math.round(360 * (videoWidth / videoHeight));

  const x = Math.round((resolved.position.x / 100) * playResX);
  const y = Math.round((resolved.position.y / 100) * playResY);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TextStyle,${fontName},${resolved.fontSize},${primaryColor},&H00FFFF00&,${outlineColor},${backColor},${resolved.bold},${resolved.italic},0,0,100,100,0,0,${borderStyle},${outline},${shadow},5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogue = `Dialogue: 0,0:00:00.00,0:00:10.00,TextStyle,,0,0,0,,{\\pos(${x},${y})}${resolved.text}`;
  return [header, dialogue].join("\n");
};

console.log("=== CAPTION ASS ===");
console.log(buildAss(editorSelections.captions, editorSelections.captionStyle, 1280, 720));

console.log("\n=== TEXT OVERLAY ASS ===");
console.log(buildTextOverlayAss(editorSelections.textOverlay, 1280, 720));
