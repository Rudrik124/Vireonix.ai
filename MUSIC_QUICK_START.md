# 🎵 Instagram-Style Music Support - Quick Start

## ✅ What's Included

Your Vireonix editor now has complete Instagram Reels-style music support!

### 🎯 Features
- **Music Library** - 9 sample royalty-free tracks (expandable)
- **Search & Filter** - By name, artist, genre, mood
- **Audio Upload** - Add MP3, WAV, AAC from device
- **Audio Editing** - Trim, adjust volume, sync with video
- **Mute Original** - Option to mute video's original audio
- **Preview** - Play music before applying
- **Smart Export** - Video with merged audio in MP4/WebM/MOV

## 🚀 Getting Started

### 1. **Integrate Music Context**

Your `EditorPage` already has `MusicProvider` wrapped around it. If you're creating other pages that need music:

```tsx
import { MusicProvider } from "@/app/context/music-context";

export function MyPage() {
  return (
    <MusicProvider>
      {/* Your page content */}
    </MusicProvider>
  );
}
```

### 2. **Use Music in Components**

```tsx
import { useMusicContext } from "@/app/context/music-context";

export function MyComponent() {
  const { selectedMusic, updateMusicSettings, clearMusic } = useMusicContext();

  return (
    <div>
      {selectedMusic && (
        <div>{selectedMusic.name} by {selectedMusic.artist}</div>
      )}
    </div>
  );
}
```

### 3. **Access Music Library**

```tsx
import {
  MUSIC_LIBRARY,
  searchMusicLibrary,
  getTrendingMusic,
  getMusicByGenre,
} from "@/lib/music-library";

// Search
const results = searchMusicLibrary("summer");

// Get all trending tracks
const trending = getTrendingMusic();

// Filter by genre
const electronic = getMusicByGenre("Electronic");
```

## 📁 File Structure

```
src/
├── app/
│   ├── context/
│   │   └── music-context.tsx          # State management
│   ├── components/editor/
│   │   ├── music-picker-modal.tsx     # Add music modal
│   │   ├── music-library.tsx          # Library browser
│   │   ├── audio-edit-controls.tsx    # Edit trim/volume
│   │   ├── music-strip.tsx            # Selected music display
│   │   └── export-modal.tsx           # Export dialog
│   └── pages/editor/
│       └── editor-page.tsx            # ✅ Already integrated
│
├── lib/
│   ├── music-library.ts               # Sample tracks
│   ├── audio-utils.ts                 # Audio validation
│   └── export-utils.ts                # Export pipeline
│
server.js                              # ✅ 4 new API endpoints added
```

## 🔧 API Endpoints

### Merge Audio with Video
```bash
POST /api/merge-audio
Content-Type: multipart/form-data

Parameters:
- videoPath: string
- musicFile: File
- volume: number (0-100)
- startTime: number (seconds)
- endTime: number (seconds)
- muteOriginal: boolean

Response: video/mp4 blob
```

### Process Audio (Trim + Volume)
```bash
POST /api/process-audio
Content-Type: multipart/form-data

Parameters:
- audioFile: File
- startTime: number
- endTime: number
- volume: number
- format: "mp3" | "wav" | "aac"

Response: audio blob
```

### Convert Audio Format
```bash
POST /api/convert-audio
Content-Type: multipart/form-data

Parameters:
- audioFile: File
- format: "mp3" | "wav" | "aac"

Response: audio blob
```

### Get Audio Metadata
```bash
POST /api/audio-metadata
Content-Type: multipart/form-data

Parameters:
- audioFile: File

Response:
{
  "duration": 180.5,
  "bitrate": 128000,
  "sampleRate": 44100,
  "channels": 2,
  "codec": "mp3"
}
```

## 🎨 UI Components

### Music Picker
```tsx
<MusicPickerModal
  isOpen={isMusicPickerOpen}
  onClose={() => setIsMusicPickerOpen(false)}
  videoDuration={20}
/>
```

### Music Display
```tsx
<MusicStrip
  videoDuration={20}
  onEditClick={() => console.log("edit clicked")}
/>
```

### Export Dialog
```tsx
<ExportModal
  isOpen={isExportModalOpen}
  onClose={() => setIsExportModalOpen(false)}
  videoDuration={20}
  onExport={handleExport}
  isExporting={false}
/>
```

## 📊 Sample Music Library

The included library has 9 tracks with metadata:

1. **Trending**
   - Midnight Vibes (30s)
   - Summer Dreams (45s)
   - Urban Beats (60s)

2. **Lo-Fi**
   - Lofi Study (180s)
   - Rainy Day (120s)

3. **Upbeat**
   - Festival Energy (90s)

4. **Other**
   - Summer Indie (180s)
   - Epic Moments (120s)
   - Acoustic Sunset (150s)

Each track has:
- Name & Artist
- Duration
- Genre & Mood
- BPM
- URL to sample audio

## 🔄 Export Workflow

```
User adds music
    ↓
Edits audio (trim, volume, mute)
    ↓
Clicks "Export"
    ↓
Selects format & quality
    ↓
Backend merges audio with video using FFmpeg
    ↓
Video downloaded to user's device
```

## ⚙️ Configuration

### Add More Music Tracks

Edit `src/lib/music-library.ts`:

```typescript
export const MUSIC_LIBRARY: MusicTrack[] = [
  // ... existing tracks ...
  {
    id: "my-track-1",
    name: "My Song",
    artist: "My Artist",
    duration: 180,
    url: "https://example.com/my-song.mp3",
    genre: "Pop",
    mood: "Happy",
    bpm: 120,
    trending: true,
  },
];
```

### Customize Audio Limits

In `server.js`:
```javascript
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FORMATS = ["audio/mpeg", "audio/wav", "audio/aac"];
```

### Change Export Defaults

In `export-modal.tsx`:
```typescript
const [exportOptions, setExportOptions] = useState({
  format: "mp4",      // Change default format
  quality: "high",    // Change default quality
  includeMusic: true, // Change default music inclusion
});
```

## 🐛 Troubleshooting

### Audio Not Playing
- Check if URL is accessible
- Verify CORS headers
- Try different audio format

### Export Failing
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check temp directory permissions
- Verify video file is valid MP4

### Audio Out of Sync
- Try syncing audio to video duration
- Check if audio duration is detected correctly
- Convert audio to AAC first

### Large File Size
- Reduce quality to "Medium" or "Low"
- Choose WebM format (better compression)
- Trim audio to exact duration

## 📈 Next Steps

### Enhance Music Library
```typescript
// Connect to real music API
import { fetchMusicFromSpotify } from "@/lib/music-api";

const tracks = await fetchMusicFromSpotify("summer");
```

### Add Audio Effects
```typescript
// Fade in/out, equalizer, etc.
import { applyAudioEffects } from "@/lib/audio-effects";

const filtered = await applyAudioEffects(audio, {
  fadeIn: 1,
  fadeOut: 1,
  equalizer: "pop",
});
```

### User Analytics
```typescript
// Track what music users choose
trackMusicUsage({
  trackId: selectedMusic.id,
  action: "export",
  quality: "high",
  duration: videoDuration,
});
```

## 📚 Documentation

See [MUSIC_FEATURE_GUIDE.md](./MUSIC_FEATURE_GUIDE.md) for:
- Complete architecture
- All API endpoints
- Integration examples
- Performance optimization
- Error handling
- Testing guide

## ✨ Features at a Glance

| Feature | Status | Details |
|---------|--------|---------|
| Music Library | ✅ | 9 sample tracks |
| Search & Filter | ✅ | By name, artist, genre, mood |
| Audio Upload | ✅ | MP3, WAV, AAC (max 100MB) |
| Audio Preview | ✅ | Real-time playback |
| Trim Audio | ✅ | Start/end controls |
| Volume Control | ✅ | 0-100% slider |
| Sync to Video | ✅ | Auto-fit to duration |
| Mute Original | ✅ | Option to mute video audio |
| Export | ✅ | MP4, WebM, MOV |
| Quality Presets | ✅ | High, Medium, Low |
| Mobile Optimized | ✅ | Touch-friendly UI |
| Animations | ✅ | Smooth transitions |

## 🎯 Quick Tips

1. **For Instagram Reels** - Use 9:16 aspect ratio, medium quality, include trending music
2. **For YouTube Shorts** - Use 9:16, high quality, longer duration
3. **For TikTok** - Use 9:16, high quality, popular trending tracks
4. **For Web** - Use 16:9, medium quality, balance file size

## 📞 Support

For issues or questions:
1. Check MUSIC_FEATURE_GUIDE.md
2. Review component prop documentation
3. Check console for error messages
4. Verify FFmpeg installation on server

---

**Happy video editing! 🎬🎵**
