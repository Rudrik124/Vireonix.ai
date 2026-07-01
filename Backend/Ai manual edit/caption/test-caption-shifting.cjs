/**
 * Test: Per-Clip Caption Shifting and Filtering
 * Verifies that subtitles are correctly offset based on their clip global start, trim start, and duration
 */

console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║        CAPTION SHIFTING TEST - MULTIPLE CLIPS                  ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// Simulate frontend payload
const mediaItems = [
  { id: "clip-001", type: "video", duration: 10 },
  { id: "clip-002", type: "video", duration: 8 },
  { id: "clip-003", type: "video", duration: 12 },
];

const clipTrimRanges = {
  "clip-001": { start: 1, end: 5 },     // 4 seconds (1-5)
  "clip-002": { start: 0, end: 4 },     // 4 seconds (0-4)
  "clip-003": { start: 2, end: 8 },     // 6 seconds (2-8)
};

const captions = [
  // Clip 1 Captions (Local times: clip-001 duration is 10s, trimmed 1-5s)
  { id: "cap-1", clipId: "clip-001", startTime: 0.1, endTime: 0.9, text: "Should be cut off (before trim start)" },
  { id: "cap-2", clipId: "clip-001", startTime: 2.0, endTime: 3.5, text: "Hello from Clip 1!" },
  { id: "cap-3", clipId: "clip-001", startTime: 6.0, endTime: 7.0, text: "Should be cut off (after trim end)" },

  // Clip 2 Captions (Local times: clip-002 duration is 8s, trimmed 0-4s)
  { id: "cap-4", clipId: "clip-002", startTime: 1.0, endTime: 3.0, text: "Welcome to Clip 2!" },

  // Clip 3 Captions (Local times: clip-003 duration is 12s, trimmed 2-8s)
  { id: "cap-5", clipId: "clip-003", startTime: 1.0, endTime: 3.0, text: "Clip 3 start (partially visible, 2-3s)" },
  { id: "cap-6", clipId: "clip-003", startTime: 4.0, endTime: 6.0, text: "Clip 3 middle" },

  // Legacy Caption (No clipId - should fall back to active clip, let's say active clip index is 0)
  { id: "cap-legacy", startTime: 3.0, endTime: 4.5, text: "Legacy caption on active clip" }
];

const transitionsByIndex = ["cross-dissolve", "slide-left"];
const segmentDurations = [4, 4, 6]; // calculated trimmed durations
const activeClipIdx = 0; // fallback target clip index
const activeClipGlobalStart = 0;

// 1. Calculate clip global starts using backend transitions logic
const clipGlobalStarts = [];
let accumulatedGlobalTime = 0;
for (let i = 0; i < mediaItems.length; i++) {
  if (i > 0) {
    const transitionType = (transitionsByIndex[i] && transitionsByIndex[i] !== "none")
      ? transitionsByIndex[i]
      : (transitionsByIndex[i - 1] || "none");
    const isNone = transitionType === "none" || transitionType === "";
    const transitionDuration = isNone
      ? 0.04
      : Math.min(0.8, segmentDurations[i - 1] * 0.3, segmentDurations[i] * 0.3);
    accumulatedGlobalTime -= transitionDuration;
  }
  clipGlobalStarts[i] = accumulatedGlobalTime;
  accumulatedGlobalTime += segmentDurations[i];
}

console.log("Calculated Clip Global Starts:");
clipGlobalStarts.forEach((start, idx) => {
  console.log(`  Clip ${idx} (${mediaItems[idx].id}): global start = ${start.toFixed(2)}s, duration = ${segmentDurations[idx]}s`);
});
console.log("");

// 2. Perform shifting and filtering
const shiftedCaptions = [];
const resolvedEditorSelections = {
  media: { items: mediaItems },
  trim: { clipRanges: clipTrimRanges }
};

for (const caption of captions) {
  const clipId = caption.clipId;
  let clipIdx = -1;
  if (clipId && Array.isArray(resolvedEditorSelections?.media?.items)) {
    clipIdx = resolvedEditorSelections.media.items.findIndex(item => item.id === clipId);
  }
  
  const targetClipIdx = clipIdx !== -1 ? clipIdx : activeClipIdx;
  const targetClipMeta = resolvedEditorSelections?.media?.items?.[targetClipIdx] || {};
  const targetClipId = targetClipMeta?.id;
  
  const clipGlobalStart = clipGlobalStarts[targetClipIdx] !== undefined ? clipGlobalStarts[targetClipIdx] : activeClipGlobalStart;
  
  const rawClipTrim = targetClipId ? resolvedEditorSelections?.trim?.clipRanges?.[targetClipId] : null;
  const clipTrimStart = rawClipTrim ? Math.max(0, Number(rawClipTrim.start) || 0) : 0;
  const clipDuration = segmentDurations[targetClipIdx] || null;
  
  // Shift relative to clip start and global timeline
  const shiftedStart = clipGlobalStart + (caption.startTime - clipTrimStart);
  const shiftedEnd = clipGlobalStart + (caption.endTime - clipTrimStart);
  
  const localStart = caption.startTime - clipTrimStart;
  const localEnd = caption.endTime - clipTrimStart;
  
  const isIncluded = localEnd > 0 && (clipDuration === null || localStart < clipDuration);
  
  console.log(`Caption "${caption.text}":`);
  console.log(`  clipId:     ${clipId || "(none) -> fallback to clip 1"}`);
  console.log(`  local:      ${caption.startTime}s - ${caption.endTime}s`);
  console.log(`  trimStart:  ${clipTrimStart}s`);
  console.log(`  localStart: ${localStart}s, localEnd: ${localEnd}s, clipDuration: ${clipDuration}s`);
  console.log(`  shifted:    ${shiftedStart.toFixed(2)}s - ${shiftedEnd.toFixed(2)}s`);
  console.log(`  status:     ${isIncluded ? "✅ INCLUDED" : "❌ EXCLUDED"}`);
  console.log("");

  if (isIncluded) {
    shiftedCaptions.push({
      ...caption,
      startTime: Math.max(0, shiftedStart),
      endTime: Math.max(0, shiftedEnd)
    });
  }
}

console.log("----------------------------------------------------------------");
console.log(`Shifting Summary: ${shiftedCaptions.length} captions kept.`);
shiftedCaptions.forEach((c) => {
  console.log(`  • [${c.id}] "${c.text}": ${c.startTime.toFixed(2)}s - ${c.endTime.toFixed(2)}s`);
});
console.log("");

// Verify checks
const checks = [
  {
    name: "cap-1 is excluded because it starts and ends before trim range",
    result: !shiftedCaptions.some(c => c.id === "cap-1")
  },
  {
    name: "cap-2 is shifted correctly (2s local - 1s trim = 1s shifted)",
    result: shiftedCaptions.some(c => c.id === "cap-2" && c.startTime === 1 && c.endTime === 2.5)
  },
  {
    name: "cap-3 is excluded because it starts after trim range",
    result: !shiftedCaptions.some(c => c.id === "cap-3")
  },
  {
    name: "cap-4 is shifted correctly (starts at clip 2 start = 3.2s global start + 1s local = 4.2s)",
    result: shiftedCaptions.some(c => c.id === "cap-4" && Math.abs(c.startTime - 4.2) < 0.01)
  },
  {
    name: "cap-5 is included and shifted correctly (ends at 3s local, which is > 2s trim start)",
    result: shiftedCaptions.some(c => c.id === "cap-5" && Math.abs(c.startTime - 5.4) < 0.01 && Math.abs(c.endTime - 7.4) < 0.01)
  },
  {
    name: "cap-legacy falls back to active clip (clip 1) and is shifted correctly (3s local - 1s trim = 2s)",
    result: shiftedCaptions.some(c => c.id === "cap-legacy" && c.startTime === 2 && c.endTime === 3.5)
  }
];

let passed = 0;
checks.forEach(c => {
  console.log(`${c.result ? "✅" : "❌"} ${c.name}`);
  if (c.result) passed++;
});

console.log(`\nPassed ${passed}/${checks.length} checks.`);
if (passed === checks.length) {
  console.log("🎉 ALL TESTS PASSED!");
  process.exit(0);
} else {
  console.log("🚨 TEST FAILURE!");
  process.exit(1);
}
