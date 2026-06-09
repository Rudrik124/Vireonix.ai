const fs = require('fs');
const file = '/Users/manjithsingh/Documents/Github/Aivideoeditor1/src/app/pages/quick-edit/style-screen.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /<video\s+ref=\{videoRef\}\s+onTimeUpdate=\{handleTimeUpdate\}\s+onEnded=\{.*\}\s+src=\{mediaItems\.find\(i => i\.id === activePreviewId\)\?\.preview\}\s+className="w-full h-full object-contain"\s+autoPlay\s+muted\s+loop=\{false\}\s+\/>/,
  `<video 
     ref={videoRef}
     onTimeUpdate={handleTimeUpdate}
     onEnded={playNextMedia}
     src={mediaItems.find(i => i.id === activePreviewId)?.preview} 
     className="w-full h-full object-contain" 
     autoPlay 
     muted={false}
     loop={false}
     playsInline
   />`
);

fs.writeFileSync(file, data);
