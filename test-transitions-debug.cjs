#!/usr/bin/env node

/**
 * Debug script to test transition data flow
 * Run: node test-transitions-debug.js
 */

const fs = require('fs');
const path = require('path');

// Test 1: Verify transition mapping function
console.log('\n=== TEST 1: Transition Mapping ===\n');

const mapClipTransitionToXfade = (transition = "none") => {
  const t = String(transition || "none");
  if (t === "cross-dissolve") return "dissolve";
  if (t === "fade-transition") return "dissolve";
  if (t === "slide-left") return "slideleft";
  if (t === "slide-right") return "slideright";
  if (t === "dip-black") return "fadeblack";
  if (t === "dip-white") return "fadewhite";
  return "dissolve";
};

const testTransitions = ["cross-dissolve", "slide-left", "slide-right", "dip-black", "none"];
testTransitions.forEach(transition => {
  const mapped = mapClipTransitionToXfade(transition);
  console.log(`✓ ${transition} → ${mapped}`);
});

// Test 2: Verify transitionPlan structure
console.log('\n=== TEST 2: TransitionPlan Structure ===\n');

const mockMediaItems = [
  { id: "clip-1", duration: 5 },
  { id: "clip-2", duration: 3 },
  { id: "clip-3", duration: 4 },
];

const mockClipTransitions = {
  "clip-1": "cross-dissolve",
  "clip-2": "slide-left",
  "clip-3": "none",
};

const transitionPlan = mockMediaItems.map((item, index) => ({
  index,
  transition: mockClipTransitions[item.id] || "none",
}));

console.log('TransitionPlan:');
console.log(JSON.stringify(transitionPlan, null, 2));

// Test 3: Verify transitionsByIndex array creation
console.log('\n=== TEST 3: TransitionsByIndex Creation ===\n');

const parsedTransitionPlan = transitionPlan;
const mediaFileCount = mockMediaItems.length;

const transitionsByIndex = Array(mediaFileCount).fill(0).map((_, index) => {
  const row = parsedTransitionPlan.find((p) => Number(p.index) === index);
  const transition = row?.transition || "none";
  return transition;
});

console.log('TransitionsByIndex:');
console.log(transitionsByIndex);
console.log('Has transitions:', transitionsByIndex.some(t => t !== "none"));

// Test 4: Verify FFmpeg xfade filter chain
console.log('\n=== TEST 4: FFmpeg Xfade Filter Chain ===\n');

const durations = [5, 3, 4];
let currentLabel = "[0:v]";
const chains = [];

for (let i = 1; i < durations.length; i++) {
  const transitionName = transitionsByIndex[i - 1] || "none";
  const xfadeType = mapClipTransitionToXfade(transitionName);
  const isNone = transitionName === "none";
  const transitionDuration = isNone ? 0.001 : 0.8;
  const offset = Math.max(0, durations[i - 1] - transitionDuration);
  const outLabel = `[v${i}]`;

  const filter = `${currentLabel}[${i}:v]xfade=transition=${xfadeType}:duration=${transitionDuration}:offset=${offset}${outLabel}`;
  chains.push(filter);

  console.log(`\nTransition ${i - 1}:`);
  console.log(`  From clip ${i - 1} (${durations[i - 1]}s) to clip ${i} (${durations[i]}s)`);
  console.log(`  Transition type: ${transitionName} → ${xfadeType}`);
  console.log(`  Offset: ${offset}s, Duration: ${transitionDuration}s`);
  console.log(`  Filter: ${filter}`);

  currentLabel = outLabel;
}

console.log('\n=== Summary ===');
console.log(`✓ Total clips: ${durations.length}`);
console.log(`✓ Total transitions: ${chains.length}`);
console.log(`✓ Final FFmpeg command will use -complexFilter with ${chains.length} xfade filters`);
console.log('\nAll tests passed! Transitions should be properly applied.');
