const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const testAssPath = path.resolve('test-temp.ass');
const testVideoPath = path.resolve('test-temp-input.mp4');
const testOutputPath = path.resolve('test-temp-output.mp4');

// Clean up previous files
if (fs.existsSync(testAssPath)) fs.unlinkSync(testAssPath);
if (fs.existsSync(testVideoPath)) fs.unlinkSync(testVideoPath);
if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);

// 1. Create a simple 2-second input video
const createVideo = () => new Promise((resolve, reject) => {
  ffmpeg()
    .input('color=c=red:s=640x360:d=2')
    .inputFormat('lavfi')
    .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
    .output(testVideoPath)
    .on('end', resolve)
    .on('error', reject)
    .run();
});

// 2. Write a mock ASS subtitle file
const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CaptionStyle,Arial,30,&H0000FFFF&,&H00FFFF00&,&H00000000&,&H00000000&,-1,0,0,0,100,100,0,0,1,2,1,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,CaptionStyle,,0,0,0,,{\\pos(320,180)}TESTING CAPTIONS BURNING!`;

const runTest = async () => {
  try {
    console.log('1. Creating test input video...');
    await createVideo();
    console.log('✓ Video created.');

    console.log('2. Writing ASS file...');
    fs.writeFileSync(testAssPath, assContent, 'utf8');
    console.log('✓ ASS file written.');

    // Normalize path using the backend's normalizeSubtitlePath helper
    const normalizeSubtitlePath = (filePath) => {
      const absolutePath = path.resolve(filePath).replace(/\\/g, "/");
      let normalized = absolutePath;
      if (/^[a-zA-Z]:/.test(normalized)) {
        normalized = normalized.charAt(0) + "\\:" + normalized.substring(2);
      }
      normalized = normalized.replace(/'/g, "\\'");
      return `'${normalized}'`;
    };

    const subtitleSource = normalizeSubtitlePath(testAssPath);
    console.log(`Normalized subtitle path: ${subtitleSource}`);

    console.log('3. Running FFmpeg subtitles burning...');
    await new Promise((resolve, reject) => {
      ffmpeg(testVideoPath)
        .videoFilters([`subtitles=${subtitleSource}`])
        .output(testOutputPath)
        .on('end', resolve)
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg stderr:\n', stderr);
          reject(err);
        })
        .run();
    });
    console.log('🎉 SUCCESS! Subtitles burned successfully.');
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  } finally {
    // Clean up
    if (fs.existsSync(testAssPath)) fs.unlinkSync(testAssPath);
    if (fs.existsSync(testVideoPath)) fs.unlinkSync(testVideoPath);
    if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
  }
};

runTest();
