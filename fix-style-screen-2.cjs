const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/pages/quick-edit/style-screen.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove showAudioChoiceLocal from TimelineHub props and let it be local
content = content.replace(
  /  showAudioChoiceLocal,\n  setShowAudioChoiceLocal,\n/,
  ""
);

// 2. Fix QuickEditStyleScreen uses of setShowAudioChoiceLocal -> setShowAudioChoice
content = content.replace(/setShowAudioChoiceLocal/g, "setShowAudioChoice");
// Re-fix the local state in TimelineHub
content = content.replace(
  /const \[showAudioChoice, setShowAudioChoice\] = useState\(false\);\n  const \[selectedAudioLane/,
  "const [showAudioChoiceLocal, setShowAudioChoiceLocal] = useState(false);\n  const [selectedAudioLane"
);
content = content.replace(
  /showAudioChoiceLocal=\{showAudioChoice\}\n              setShowAudioChoiceLocal=\{setShowAudioChoice\}/g,
  ""
);

// 3. overlayTextStylePresetCss is missing where it's used?
// Let's replace overlayTextStylePresetCss with getOverlayTextStylePresetCss inside TimelineHub body if it's there? No, the prop was `overlayTextStylePresetCss`, wait.
content = content.replace(/overlayTextStylePresetCss/g, "getOverlayTextStylePresetCss");
// But in TimelineHub props it was `overlayTextStylePresetCss`. If we rename it everywhere to `getOverlayTextStylePresetCss`, it will work.

fs.writeFileSync(file, content);
console.log('Fixed style-screen.tsx again');
