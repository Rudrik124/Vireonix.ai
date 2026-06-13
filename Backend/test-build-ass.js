// Mock captions - simulating the user's example
const captions = [
  { id: "cap1", text: "gain conscious means are not hallucinations.", startTime: 0.0, endTime: 2.5 }
];

// Mock style - simulates the "vintage" preset the user chose:
// Gold text, dark brown background, bold, centered at posY=85
const style = {
  fontFamily: "Copperplate, Papyrus, serif",
  fontSize: 40,
  color: "#FFD700",
  bgEnabled: true,
  bgColorHex: "#663300",
  alignment: "center",
  bold: true,
  italic: false,
  outline: false,
  posX: 50,
  posY: 85
};

// Copied helper functions from server.js
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

// Updated buildAss — now takes actual video dimensions as parameters
const buildAss = (captions, style = {}, videoWidth = 1280, videoHeight = 720) => {
  const fontName = String(style.fontFamily || "Arial").split(",")[0].trim().replace(/['"]/g, "");
  const fontSize = style.fontSize || 26;
  const primaryColor = convertHexToAssColor(style.color || "#FFFFFF");
  // alpha 00 = fully opaque in libass (00=opaque, FF=transparent)
  const backColor = style.bgEnabled 
    ? convertHexToAssColorWithAlpha(style.bgColorHex || "#000000", "00") 
    : "&HFF000000&";
  const borderStyle = style.bgEnabled ? 3 : 1;
  const bold = style.bold ? -1 : 0;
  const italic = style.italic ? -1 : 0;
  const outline = style.outline ? 2 : (style.bgEnabled ? 2 : 0);
  const shadow = style.bgEnabled ? 0 : 1;
  const alignment = style.alignment === "left" ? 4 : style.alignment === "right" ? 6 : 5;

  // Use actual video dimensions so libass scales fonts/positions/colors correctly
  const playResX = videoWidth;
  const playResY = videoHeight;

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

// Test with actual video dimensions probed from the real video (1904x992)
console.log("=== ASS for 1904x992 video (matches actual video) ===");
console.log(buildAss(captions, style, 1904, 992));

console.log("\n=== ASS for 1280x720 video (old hardcoded fallback) ===");
console.log(buildAss(captions, style, 1280, 720));
