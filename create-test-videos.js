#!/usr/bin/env node

/**
 * Create simple test video files for transition testing
 * This creates minimal MP4 files that can be used to test the transitions API
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Get ffmpeg paths - ffmpeg and ffprobe should be in PATH
const ffmpegPath = process.platform === 'win32' ? 'ffmpeg' : 'ffmpeg';
const ffprobePath = process.platform === 'win32' ? 'ffprobe' : 'ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const outputDir = path.join(__dirname, 'test-videos');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const videos = [
  { name: 'test-video-1.mp4', text: 'Video 1', color: '0x FF6B6B' },
  { name: 'test-video-2.mp4', text: 'Video 2', color: '0x 4ECDC4' },
  { name: 'test-video-3.mp4', text: 'Video 3', color: '0x 45B7D1' },
];

let completed = 0;

console.log('🎬 Creating test videos for transition testing...\n');

videos.forEach((video) => {
  const outputPath = path.join(outputDir, video.name);
  
  console.log(`📹 Creating ${video.name}...`);
  
  ffmpeg()
    .input('color=c=' + video.color + ':s=1280x720:d=3')
    .input('anullsrc=r=48000:cl=mono')
    .inputOptions(['-f', 'lavfi'])
    .inputOptions(['-f', 'lavfi'])
    .drawText({
      fontfile: 'Arial.ttf',
      text: video.text,
      fontsize: 60,
      fontcolor: 'white',
      x: '(w-text_w)/2',
      y: '(h-text_h)/2',
    })
    .on('error', (err) => {
      console.error(`❌ Error creating ${video.name}:`, err.message);
      completed++;
      if (completed === videos.length) {
        console.log('\n✅ Test video creation complete!');
        console.log(`📂 Videos saved to: ${outputDir}`);
      }
    })
    .on('end', () => {
      console.log(`✅ Created ${video.name}\n`);
      completed++;
      if (completed === videos.length) {
        console.log('✅ All test videos created successfully!');
        console.log(`📂 Videos saved to: ${outputDir}`);
        console.log('\nYou can now test the timeline editor with these videos:');
        videos.forEach((v) => console.log(`  - ${path.join(outputDir, v.name)}`));
      }
    })
    .output(outputPath)
    .outputOptions([
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-preset', 'veryfast',
    ])
    .run();
});
