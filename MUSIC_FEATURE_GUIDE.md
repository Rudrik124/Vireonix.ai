# Instagram-Style Music Support Implementation Guide

## Overview

This implementation adds comprehensive Instagram-style music support to the Vireonix editor, allowing users to:
- Add background music from a built-in library or device storage
- Preview music before applying
- Edit audio (trim, adjust volume, sync with video)
- Mute original video audio
- Export videos with merged audio

## Architecture

### 1. **State Management** (`src/app/context/music-context.tsx`)

The `MusicProvider` manages the selected music and its settings:

```typescript
interface SelectedMusic {
  id: string;
  name: string;
  artist: string;
  duration: number;
  source: "library" | "device";
  url?: string;
  file?: File;
  volume: number; // 0-100
  startTime: number; // trim start in seconds
  endTime: number; // trim end in seconds
  muteOriginal: boolean;
}
```

**Usage:**
```tsx
const { selectedMusic, updateMusicSettings, clearMusic } = useMusicContext();
```

### 2. **Music Library** (`src/lib/music-library.ts`)

Contains a pre-loaded library of royalty-free music tracks with metadata:
- Name, artist, duration
- Genre and mood tags
- BPM information
- Trending indicator

Supports searching, filtering by genre/mood, and trending tracks.

### 3. **Components**

#### **MusicPickerModal** (`src/app/components/editor/music-picker-modal.tsx`)
- Two tabs: Music Library and Upload Audio
- File validation (MP3, WAV, AAC up to 100MB)
- Audio duration detection
- Similar to Instagram Reels music picker UX

#### **MusicLibrary** (`src/app/components/editor/music-library.tsx`)
- Grid/List view toggle
- Search functionality
- Genre/Mood filtering
- Music preview playback
- Trending section

#### **AudioEditControls** (`src/app/components/editor/audio-edit-controls.tsx`)
- Audio preview player
- Volume slider (0-100%)
- Trim controls (start/end time)
- Sync with video button
- Mute original audio toggle
- Real-time duration display

#### **MusicStrip** (`src/app/components/editor/music-strip.tsx`)
- Compact display of selected music
- Quick stats (duration, volume, status)
- Edit button to expand controls
- Remove button to clear selection

#### **ExportModal** (`src/app/components/editor/export-modal.tsx`)
- Export format selection (MP4, WebM, MOV)
- Quality options (High, Medium, Low)
- Music inclusion toggle
- File size estimation
- Export progress tracking

### 4. **API Endpoints** (`server.js`)

#### **POST `/api/merge-audio`**
Merges audio with video, applying volume and trim settings.

```javascript
// Request
{
  videoPath: string;
  musicFile: File;
  volume: number; // 0-100
  startTime: number;
  endTime: number;
  muteOriginal: boolean;
}

// Response: Merged video (MP4)
```

#### **POST `/api/process-audio`**
Processes audio (trim + volume adjustment).

```javascript
{
  audioFile: File;
  startTime: number;
  endTime: number;
  volume: number;
  format: "mp3" | "wav" | "aac";
}
```

#### **POST `/api/convert-audio`**
Converts audio between formats.

#### **POST `/api/audio-metadata`**
Gets audio metadata (duration, bitrate, sample rate, channels, codec).

### 5. **Utilities**

#### **export-utils.ts**
- `exportVideoWithMusic()` - Main export function
- `downloadVideoBlob()` - Client-side download
- `estimateExportSize()` - Size estimation
- `uploadExportedVideo()` - Supabase upload (optional)

#### **audio-utils.ts**
- `prepareAudioForExport()` - Prepare audio data
- `getAudioDuration()` - Get duration from file
- `validateAudioFile()` - File validation
- `mergeVideoWithAudio()` - Backend merge call

## Usage Flow

### 1. **Adding Music**
```
User clicks "Add Music" 
  → MusicPickerModal opens
    → Choose from library OR upload file
      → Music is added to context
        → MusicStrip displays selected music
```

### 2. **Editing Audio**
```
User clicks "Edit" on MusicStrip
  → AudioEditControls expands
    → User adjusts: volume, trim, sync, mute
      → Settings update in real-time
        → Preview available
```

### 3. **Exporting**
```
User clicks "Quick Export"
  → ExportModal opens
    → User selects format, quality, includes music
      → Export starts
        → Audio merged with video via /api/merge-audio
          → File downloaded to user's device
```

## Integration with Editor Page

```tsx
import { MusicProvider } from "../../context/music-context";
import { MusicPickerModal } from "../../components/editor/music-picker-modal";
import { MusicStrip } from "../../components/editor/music-strip";
import { ExportModal } from "../../components/editor/export-modal";

export function EditorPage() {
  return (
    <MusicProvider>
      {/* Editor UI */}
      <Button onClick={() => setIsMusicPickerOpen(true)}>Add Music</Button>
      <MusicStrip videoDuration={videoDuration} />
      <MusicPickerModal 
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        videoDuration={videoDuration}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoDuration={videoDuration}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </MusicProvider>
  );
}
```

## Audio Processing Pipeline

### Backend (FFmpeg)

1. **Audio Trimming**
   - Cut audio to specified start/end times
   - Preserves sample rate and format

2. **Volume Adjustment**
   - Apply volume filter using FFmpeg
   - Range: 0-100% maps to FFmpeg volume 0-1

3. **Audio Merging**
   - Input: Video + Audio
   - Option 1: Replace original audio
   - Option 2: Mix original + new audio
   - Output: MP4 with AAC audio

### Frontend

1. **File Validation**
   - Check MIME type
   - Verify file size (<100MB)
   - Detect audio duration

2. **Preview**
   - Play audio in HTML5 player
   - Show real-time progress
   - Allow pause/resume

3. **Export**
   - Prepare FormData with settings
   - Send to backend
   - Download resulting video

## Performance Optimizations

1. **Audio Caching**
   - Library tracks cached in localStorage
   - Reduce redundant API calls

2. **Preview Optimization**
   - Use Web Audio API for volume preview
   - Lower quality for preview

3. **Export Optimization**
   - Quality presets to balance speed/quality
   - Parallel processing (if backend supports)
   - Chunked uploads for large files

4. **Mobile Performance**
   - Responsive grid/list layouts
   - Touch-friendly controls
   - Reduced quality by default

## Supported Audio Formats

- **Input:** MP3, WAV, AAC, M4A
- **Output:** MP4 with AAC audio
- **Maximum file size:** 100MB
- **Sample rates:** 44.1kHz - 48kHz

## Error Handling

```typescript
// File validation errors
- "Unsupported audio format"
- "File size exceeds 100MB limit"

// Processing errors
- "Failed to read audio metadata"
- "Audio merge failed"
- "Export failed"

// Network errors
- Retry logic with exponential backoff
- User-friendly error messages
```

## UI/UX Features

### Instagram-Style Animations
- Smooth transitions when opening modals
- Loading spinners during export
- Success feedback
- Toast notifications for errors

### Accessibility
- Keyboard navigation support
- ARIA labels on controls
- Screen reader friendly
- High contrast design

### Responsive Design
- Mobile-optimized layouts
- Touch-friendly buttons
- Collapsible sections
- Horizontal scrolling for mobile

## Future Enhancements

1. **Advanced Audio Effects**
   - Fade in/out
   - Equalizer
   - Reverb/compression

2. **Music Library Integration**
   - Connect to Spotify/Apple Music API
   - In-app purchase credits
   - User uploads

3. **Batch Processing**
   - Multiple video exports
   - Scheduled exports
   - Queue management

4. **Analytics**
   - Track popular music choices
   - Export statistics
   - User preferences

## Testing

### Unit Tests
- Music context functionality
- Utility functions (validation, formatting)
- Component state management

### Integration Tests
- Music picker flow
- Audio editing pipeline
- Export process

### E2E Tests
- Full user journey (add music → edit → export)
- Error handling
- Edge cases

## Deployment Checklist

- [ ] FFmpeg installed on server
- [ ] Multer configured for file uploads
- [ ] Temporary directory cleanup job
- [ ] Audio file size limits enforced
- [ ] Error logging configured
- [ ] Performance monitoring
- [ ] User quota/limits (if needed)

## Dependencies

Already included:
- React, React-Router
- Radix UI components
- Tailwind CSS
- FFmpeg (server)
- Multer (file upload)

New dependencies added:
- lucide-react (icons) - already in project
- Web Audio API (browser native)

## Environment Variables

```bash
# Server audio processing
FFMPEG_PATH=/usr/bin/ffmpeg
UPLOAD_MAX_SIZE=104857600  # 100MB in bytes
TEMP_AUDIO_DIR=/tmp/audio-processing
```

## API Response Examples

### Successful Audio Merge
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "message": "Audio merged successfully",
    "videoPath": "/tmp/merged-video.mp4"
  }
}
```

### Audio Metadata
```json
{
  "success": true,
  "duration": 180.5,
  "bitrate": 128000,
  "sampleRate": 44100,
  "channels": 2,
  "codec": "mp3"
}
```

## Troubleshooting

### Audio not merging
- Verify FFmpeg installation: `ffmpeg -version`
- Check file permissions on temp directory
- Validate input video is valid MP4

### Export taking too long
- Reduce quality setting
- Check server CPU usage
- Verify sufficient disk space

### Audio out of sync
- Ensure video duration is correctly detected
- Check for video/audio codec issues
- Try converting audio to AAC first

---

## Summary

This implementation provides a complete Instagram-style music editing experience with:
- ✅ Music library with search/filters
- ✅ Device audio upload
- ✅ Real-time audio editing
- ✅ Video export with merged audio
- ✅ Mobile-optimized UI
- ✅ Error handling & validation
- ✅ High performance

The feature is modular, extensible, and production-ready!
