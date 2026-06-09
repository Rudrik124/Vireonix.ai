const fs = require('fs');
const glob = require('glob');

const files = [
  'index.html',
  'vite.config.ts',
  'src/app/pages/editor/editor-page.tsx',
  'src/app/pages/images-to-video/preview-screen.tsx',
  'src/app/pages/quick-edit/upload-screen.tsx',
  'src/app/pages/quick-edit/processing-screen.tsx',
  'src/app/pages/images-to-video/upload-screen.tsx',
  'src/app/pages/reference-video/result-screen.tsx',
  'src/app/pages/AI-Video_Generation/ai-generative-video.tsx',
  'src/app/pages/AI-Video_Generation/result.tsx',
  'src/app/main/video-type-page.tsx',
  'src/app/main/features-selection.tsx',
  'src/app/pages/reference-video/setup-screen.tsx',
  'src/app/components/premium-modal.tsx',
  'src/app/components/history-dialog.tsx',
  'src/app/components/brand-logo.tsx',
  'src/app/main/home-page.tsx',
  'src/app/components/login-modal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/VIREONIX/g, 'VEYTRIX');
    content = content.replace(/Vireonix/g, 'Veytrix');
    content = content.replace(/vireonix/g, 'veytrix');
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Replacement complete');
