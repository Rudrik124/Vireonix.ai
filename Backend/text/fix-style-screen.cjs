const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/pages/quick-edit/style-screen.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix TransitionType
content = content.replace(
  /type TransitionType =([\s\S]*?);/,
  `type TransitionType =
    | 'none'
    | 'fade-transition'
    | 'zoom-transition'
    | 'blur-transition'
    | 'swipe-transition'
    | 'spin-transition'
    | 'whip-pan-transition'
    | 'glitch-transition'
    | 'mask-transition'
    | 'flash-transition'
    | 'camera-shake-transition'
    | 'match-cut-transition'
    | 'speed-ramp-transition'
    | 'cross-dissolve'
    | 'slide-left'
    | 'slide-right'
    | 'dip-black'
    | 'dip-white';`
);

// 2. Fix e: any in Drag events
content = content.replace(/onDragStart={\(e\)/g, "onDragStart={(e: any)");
content = content.replace(/onDrop={\(e\)/g, "onDrop={(e: any)");
content = content.replace(/onDragStart={\(event\)/g, "onDragStart={(event: any)");
content = content.replace(/onDrop={\(event\)/g, "onDrop={(event: any)");

// 3. Fix TimelineHub props
content = content.replace(
  "  overlayTextStylePresetCss,\n}: any) => {",
  "  overlayTextStylePresetCss,\n  extractingAudio,\n  audioError,\n  showAudioChoiceLocal,\n  setShowAudioChoiceLocal,\n  recognition,\n}: any) => {"
);

// 4. Fix ToolInspector props
content = content.replace(
  "const ToolInspector = memo(({",
  "const ToolInspector = memo(({\n  velocitySpeed,\n  setVelocitySpeed,\n  motionBlurAmount,\n  setMotionBlurAmount,\n  shakeStrength,\n  setShakeStrength,\n  flashIntensity,\n  setFlashIntensity,\n  rgbSplitAmount,\n  setRgbSplitAmount,\n  smoothZoomAmount,\n  setSmoothZoomAmount,\n  filmGrainOpacity,\n  setFilmGrainOpacity,\n  overlayTextStylePreset,\n  setOverlayTextStylePreset,\n  getOverlayTextEffectForPreset,"
);

// 5. Fix QuickEditStyleScreen ToolInspector call
content = content.replace(
  /<ToolInspector\n\s*activeTool=\{activeTool\}/,
  `<ToolInspector
                      velocitySpeed={velocitySpeed} setVelocitySpeed={setVelocitySpeed}
                      motionBlurAmount={motionBlurAmount} setMotionBlurAmount={setMotionBlurAmount}
                      shakeStrength={shakeStrength} setShakeStrength={setShakeStrength}
                      flashIntensity={flashIntensity} setFlashIntensity={setFlashIntensity}
                      rgbSplitAmount={rgbSplitAmount} setRgbSplitAmount={setRgbSplitAmount}
                      smoothZoomAmount={smoothZoomAmount} setSmoothZoomAmount={setSmoothZoomAmount}
                      filmGrainOpacity={filmGrainOpacity} setFilmGrainOpacity={setFilmGrainOpacity}
                      overlayTextStylePreset={overlayTextStylePreset} setOverlayTextStylePreset={setOverlayTextStylePreset}
                      getOverlayTextEffectForPreset={getOverlayTextEffectForPreset}
                      activeTool={activeTool}`
);

// 6. Fix QuickEditStyleScreen TimelineHub call
content = content.replace(
  /overlayTextStylePresetCss=\{getOverlayTextStylePresetCss\}\n\s*\/>/g,
  `overlayTextStylePresetCss={getOverlayTextStylePresetCss}
              extractingAudio={extractingAudio}
              audioError={audioError}
              showAudioChoiceLocal={showAudioChoice}
              setShowAudioChoiceLocal={setShowAudioChoice}
              recognition={recognition}
            />`
);

// 7. Fix recognition init
content = content.replace(
  /const origGUM = navigator.mediaDevices.getUserMedia.bind\(navigator.mediaDevices\);/,
  `const recognition = new SR();
    const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);`
);

fs.writeFileSync(file, content);
console.log('Fixed style-screen.tsx');
