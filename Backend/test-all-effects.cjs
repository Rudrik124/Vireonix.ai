const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

// Define all effects as in server.js
const effectsList = [
  "fade-in",
  "blur",
  "color-correction",
  "vintage",
  "black-white",
  "cinematic",
  "warm",
  "cool",
  "sepia",
  "hdr",
  "vivid",
  "soft-glow",
  "retro-film",
  "slow-motion",
  "glitch",
  "zoom",
  "green-screen",
  "motion-tracking",
  "shake",
  "velocity",
  "motion-blur",
  "flash-effect",
  "rgb-split",
  "smooth-zoom",
  "film-grain",
  "moody",
  "warm-tone",
  "cool-tone",
  "teal-orange",
  "dreamy-glow",
  "film-look",
  "vhs",
  "soft-skin",
  "neon-glow",
  "hdr-pop",
  "old-tv"
];

// Helper to construct filters from server.js applyEffectsToVideo
const getFiltersForEffect = (effect, settings = {}, metadata = { width: 640, height: 360, fps: 30 }) => {
  const videoFilters = [];
  const durationSeconds = 3;

  if (effect === "fade-in" || effect === "transition") {
    const fadeDuration = 1;
    videoFilters.push(`fade=t=in:st=0:d=${fadeDuration}`);
  }
  if (effect === "blur") {
    const blur = 10;
    videoFilters.push(`boxblur=${blur}:1`);
  }
  if (effect === "color-correction") {
    videoFilters.push("eq=brightness=0:contrast=1:saturation=1");
  }
  if (effect === "vintage") {
    videoFilters.push("eq=saturation=0.72:contrast=0.93:brightness=0.03");
    videoFilters.push("curves=r='0/0.08 0.60/0.52 1/0.92':g='0/0.06 0.70/0.56 1/0.86':b='0/0.05 0.80/0.52 1/0.76'");
    videoFilters.push("noise=alls=14:allf=t+u");
  }
  if (effect === "black-white") {
    videoFilters.push("hue=s=0");
  }
  if (effect === "cinematic") {
    videoFilters.push("eq=contrast=1.4:brightness=0.08:saturation=1.2");
    videoFilters.push("colorbalance=rs=0.08:gs=0.02:bs=-0.08");
  }
  if (effect === "warm") {
    videoFilters.push("colorbalance=rs=0.12:gs=0.05:bs=-0.10");
    videoFilters.push("eq=saturation=1.1:brightness=0.03");
  }
  if (effect === "cool") {
    videoFilters.push("colorbalance=rs=-0.10:gs=-0.05:bs=0.14");
    videoFilters.push("eq=saturation=1.05");
  }
  if (effect === "sepia") {
    videoFilters.push("colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131");
  }
  if (effect === "hdr") {
    videoFilters.push("eq=contrast=1.6:brightness=0.10:saturation=1.4");
    videoFilters.push("unsharp=5:5:1.1:5:5:0.0");
  }
  if (effect === "vivid") {
    videoFilters.push("eq=saturation=2.5:contrast=1.3:brightness=0.07");
  }
  if (effect === "soft-glow") {
    videoFilters.push("gblur=sigma=1.2,eq=brightness=0.08:contrast=1.05");
  }
  if (effect === "retro-film") {
    videoFilters.push("eq=saturation=0.92:contrast=1.06:brightness=0.02");
    videoFilters.push("colorbalance=rs=-0.03:gs=0.05:bs=-0.08");
    videoFilters.push("noise=alls=10:allf=t+u");
    videoFilters.push("drawgrid=width=iw:height=4:thickness=1:color=black@0.08");
  }
  if (effect === "slow-motion") {
    const speed = 0.25;
    const stretch = 1 / speed;
    videoFilters.push(`setpts=${stretch.toFixed(3)}*PTS`);
  }
  if (effect === "glitch") {
    const intensity = 1;
    const noiseLevel = Math.round(10 + intensity * 20);
    videoFilters.push(`noise=alls=${noiseLevel}:allf=t+u`);
  }
  if (effect === "zoom") {
    videoFilters.push("scale=iw*1.2:ih*1.2,crop=iw/1.2:ih/1.2");
  }
  if (effect === "green-screen") {
    videoFilters.push("lutrgb=g='val*0.15'");
  }
  if (effect === "motion-tracking") {
    videoFilters.push("tblend=all_mode=difference,eq=contrast=2.0:brightness=0.05:saturation=0");
  }
  if (effect === "shake") {
    const strength = 1.5;
    videoFilters.push(`crop=iw-20:ih-20:10+${strength}*1.5*sin(2*PI*t*8):10+${strength}*1.5*cos(2*PI*t*6.5)`);
  }
  if (effect === "velocity") {
    const speed = 1.5;
    const stretch = 1 / speed;
    videoFilters.push(`setpts=${stretch.toFixed(3)}*PTS`);
  }
  if (effect === "motion-blur") {
    const frames = 8;
    const fps = metadata.fps || 30;
    videoFilters.push(`fps=${fps}`);
    videoFilters.push(`tmix=frames=${frames}`);
    videoFilters.push("gblur=sigma=1.0");
  }
  if (effect === "flash-effect") {
    const intensity = 0.75;
    const br = (0.20 * intensity).toFixed(3);
    const co = (1 + 0.20 * intensity).toFixed(3);
    videoFilters.push(`eq=brightness=${br}:contrast=${co}`);
  }
  if (effect === "rgb-split") {
    const amount = 12;
    const cbh = Math.round(amount / 3);
    const crh = Math.round(-amount / 3);
    videoFilters.push(`chromashift=cbh=${cbh}:cbv=0:crh=${crh}:crv=0,eq=contrast=1.2:saturation=1.3`);
  }
  if (effect === "smooth-zoom") {
    const dur = 3;
    const amount = 0.35;
    const zoomScale = (0.12 * (amount / 0.35)).toFixed(4);
    videoFilters.push(`zoompan=z='1+${zoomScale}*sin(PI*on/(${metadata.fps}*${dur}))':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=${metadata.width}x${metadata.height}:fps=${metadata.fps}`);
  }
  if (effect === "film-grain") {
    const opacity = 0.4;
    const noiseLevel = Math.round(8 + opacity * 20);
    videoFilters.push(`noise=alls=${noiseLevel}:allf=t+u,eq=contrast=1.05:saturation=1.1`);
  }
  if (effect === "moody") {
    videoFilters.push("eq=contrast=1.3:brightness=-0.05:saturation=0.75");
  }
  if (effect === "warm-tone") {
    videoFilters.push("colorbalance=rs=0.10:gs=0.04:bs=-0.08,hue=h=-8,eq=saturation=1.25:brightness=0.03");
  }
  if (effect === "cool-tone") {
    videoFilters.push("colorbalance=rs=-0.08:gs=-0.03:bs=0.12,hue=h=14,eq=saturation=1.1:brightness=-0.01");
  }
  if (effect === "teal-orange") {
    videoFilters.push("colorbalance=rs=0.15:gs=0.0:bs=-0.15:rm=0.12:gm=-0.02:bm=-0.12,hue=h=-7,eq=contrast=1.3:saturation=1.25:brightness=0.01");
  }
  if (effect === "dreamy-glow") {
    videoFilters.push("gblur=sigma=1.0,eq=contrast=0.95:saturation=1.15:brightness=0.03");
  }
  if (effect === "film-look") {
    videoFilters.push("eq=contrast=1.2:brightness=0.03:saturation=1.15,curves=preset=vintage");
  }
  if (effect === "vhs") {
    videoFilters.push("chromashift=cbh=2:cbv=1:crh=-2:crv=-1,noise=alls=8:allf=t+u,eq=contrast=1.15:saturation=1.2,hue=h=2");
  }
  if (effect === "soft-skin") {
    videoFilters.push("smartblur=lr=1.5:ls=-0.5,eq=brightness=0.03:saturation=1.15:contrast=0.95");
  }
  if (effect === "neon-glow") {
    videoFilters.push("eq=saturation=1.4:brightness=0.03:contrast=1.2,hue=h=10");
  }
  if (effect === "hdr-pop") {
    videoFilters.push("eq=contrast=1.55:brightness=0.08:saturation=1.45,unsharp=5:5:1.2:5:5:0.0");
  }
  if (effect === "old-tv") {
    videoFilters.push("noise=alls=14:allf=t+u");
    videoFilters.push("eq=contrast=1.12:saturation=0.85:brightness=0.02");
    videoFilters.push("chromashift=cbh=3:cbv=2:crh=-3:crv=-2");
    videoFilters.push("vignette=angle=0.6:mode=forward");
    videoFilters.push("hue=h=4");
    videoFilters.push("drawgrid=width=iw:height=4:thickness=1:color=black@0.15");
  }

  return videoFilters;
};

async function testAll() {
  console.log("Starting test of all effects...");
  for (const eff of effectsList) {
    const filters = getFiltersForEffect(eff);
    if (!filters.length) {
      console.log(`- ${eff}: SKIPPED (no filters)`);
      continue;
    }
    
    const outPath = `test-effect-${eff}.mp4`;
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    await new Promise((resolve) => {
      ffmpeg()
        .input('color=c=red:s=640x360:d=1')
        .inputFormat('lavfi')
        .videoFilters(filters)
        .output(outPath)
        .on('error', (err, stdout, stderr) => {
          console.log(`❌ ${eff}: FAILED: ${err.message}`);
          resolve();
        })
        .on('end', () => {
          console.log(`✓ ${eff}: SUCCESS`);
          if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
          resolve();
        })
        .run();
    });
  }
}

testAll();
