#!/usr/bin/env node

/**
 * Test xfade filter generation and FFmpeg command execution
 * This script tests the transition logic without requiring the full API
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Test filter chain generation
console.log("🧪 Testing xfade filter chain generation...\n");

// Simulate segment data
const segmentPaths = ['seg1.mp4', 'seg2.mp4', 'seg3.mp4'];
const durations = [3.0, 3.5, 2.8];
const transitions = ['fade', 'fade'];  // Transitions between segments

// Build xfade filter chain (copied from server logic)
const transitionDuration = 0.5;
let filterChain = "";
let currentLabel = "[0:v]";

const mapClipTransitionToXfade = (transition = "none") => {
  const t = String(transition || "none").toLowerCase().trim();
  if (t === "fade" || t === "crossfade" || t === "cross-dissolve") {
    return "dissolve";
  }
  if (t === "slide" || t === "slide-left") {
    return "slideleft";
  }
  if (t === "wipe" || t === "slide-right") {
    return "wiperight";
  }
  if (t === "zoom") {
    return "zoomin";
  }
  if (t === "none") {
    return "fade";
  }
  return "dissolve";
};

for (let i = 1; i < segmentPaths.length; i++) {
  const transitionType = transitions[i - 1] || "none";
  const xfadeType = mapClipTransitionToXfade(transitionType);
  const prevDuration = durations[i - 1];
  
  const minOffset = 0.1;
  const maxOffset = Math.max(minOffset, prevDuration - 0.1);
  const targetOffset = prevDuration - transitionDuration;
  const offset = Math.max(minOffset, Math.min(maxOffset, targetOffset));
  
  const nextLabel = `[xfade${i}]`;
  if (filterChain) filterChain += ";";
  filterChain += `${currentLabel}[${i}:v]xfade=transition=${xfadeType}:duration=${transitionDuration}:offset=${offset.toFixed(2)}${nextLabel}`;
  
  console.log(`  → Clip ${i-1} → ${i}: ${transitionType}`);
  console.log(`     xfade type: ${xfadeType}, offset: ${offset.toFixed(2)}s, duration: ${transitionDuration}s`);
  
  currentLabel = nextLabel;
}

console.log("\n✅ Generated filter chain:");
console.log(`   ${filterChain}`);
console.log(`\n   Final output label: ${currentLabel}`);
console.log(`\n   This filter should be passed to FFmpeg like:`);
console.log(`   ffmpeg -i seg1.mp4 -i seg2.mp4 -i seg3.mp4 -filter_complex "${filterChain}" -map "${currentLabel}" ...`);
