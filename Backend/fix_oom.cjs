const fs = require('fs');
const p = require('path');
const f = p.join(process.cwd(), 'server.js');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/("-preset",?\s*"?(?:ultrafast|veryfast|fast)"?)/g, '$1, "-threads", "1"');
c = c.replace(/("-preset\s+(?:ultrafast|veryfast|fast)")/g, '$1, "-threads 1"');

// Special cases from earlier finding
c = c.replace(/("-c:v libx264", "-pix_fmt yuv420p", "-preset fast", "-crf 23", "-c:a aac", "-movflags \+faststart")/g, '"-c:v libx264", "-pix_fmt yuv420p", "-preset ultrafast", "-crf 28", "-threads 1", "-c:a aac", "-movflags +faststart"');

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed server.js ffmpeg OOM');
