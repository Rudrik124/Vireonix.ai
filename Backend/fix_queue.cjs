const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

if (!c.includes('import pLimit from "p-limit";')) {
  c = 'import pLimit from "p-limit";\nconst ffmpegQueue = pLimit(1);\n' + c;
}

// Replace all instances of `await new Promise((resolve, reject) => {\n  let command = ffmpeg()`
// and similar variations with `await ffmpegQueue(() => new Promise((resolve, reject) => {`
c = c.replace(/await new Promise\(\(resolve, reject\) => \{\s+(let command = ffmpeg\(\)|ffmpeg\()/g, 'await ffmpegQueue(() => new Promise((resolve, reject) => {\n    $1');

fs.writeFileSync('server.js', c, 'utf8');
console.log('Done replacing ffmpegQueue in server.js');
