# Music Library Configuration & Expansion Guide

## Current Music Library

The default library includes 9 royalty-free sample tracks. You can expand it by:

1. Adding new tracks to `MUSIC_LIBRARY` array
2. Connecting to external APIs
3. Implementing user uploads
4. Integrating music subscription services

## Adding Custom Tracks

### Method 1: Direct Addition

Edit `src/lib/music-library.ts`:

```typescript
export const MUSIC_LIBRARY: MusicTrack[] = [
  // ... existing tracks ...
  {
    id: "custom-1",
    name: "Your Song Title",
    artist: "Artist Name",
    duration: 180, // in seconds
    url: "https://your-cdn.com/song.mp3", // Must be CORS-enabled
    genre: "Electronic",
    mood: "Energetic",
    bpm: 128,
    cover: "https://your-cdn.com/cover.jpg", // optional
    trending: false, // Set to true for trending section
  },
  // ... more tracks ...
];
```

### Method 2: Dynamic Loading

```typescript
// Fetch from API at runtime
async function loadMusicLibrary() {
  const response = await fetch("/api/music-library");
  const tracks = await response.json();
  return tracks;
}

// In music-library.tsx
const [tracks, setTracks] = useState<MusicTrack[]>([]);

useEffect(() => {
  loadMusicLibrary().then(setTracks);
}, []);
```

## Genre Categories

Available genres:
- Electronic
- Pop
- Hip-Hop
- Lo-Fi
- Dance
- Indie
- Cinematic
- Acoustic
- Rock
- Jazz
- Ambient
- Folk

To add a new genre, add tracks with the genre name in `MUSIC_LIBRARY`.

## Mood Categories

Available moods:
- Chill
- Happy
- Energetic
- Relaxed
- Melancholic
- Uplifting
- Dramatic
- Calm

## BPM Ranges

Music typically falls into these BPM ranges:
- Slow: 60-90 BPM
- Moderate: 90-120 BPM
- Fast: 120-140 BPM
- Very Fast: 140+ BPM

## Example: Premium Music Integration

### Spotify Integration

```typescript
// lib/music-providers/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyClient = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function searchSpotifyMusic(query: string): Promise<MusicTrack[]> {
  const results = await spotifyClient.searchTracks(query, { limit: 20 });
  
  return results.tracks.items.map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    duration: Math.round(track.duration_ms / 1000),
    url: track.preview_url, // 30-second preview
    genre: "Mixed", // Spotify doesn't return genre per track
    mood: "Unknown",
    cover: track.album.images[0]?.url,
  }));
}
```

### Apple Music Integration

```typescript
// lib/music-providers/apple-music.ts
export async function searchAppleMusic(query: string): Promise<MusicTrack[]> {
  const token = await getAppleMusicToken();
  
  const response = await fetch(
    `https://api.music.apple.com/v1/catalog/us/search?term=${query}&types=songs`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  return data.results.songs.data.map(song => ({
    id: song.id,
    name: song.attributes.name,
    artist: song.attributes.artistName,
    duration: Math.round(song.attributes.durationInMillis / 1000),
    url: song.attributes.previews?.[0]?.url,
    genre: song.attributes.genreNames?.[0],
    mood: "Unknown",
    cover: song.attributes.artwork?.url,
  }));
}
```

## CDN Setup for Audio Files

Host music files on a CDN for best performance:

### AWS S3 Example

```typescript
// lib/music-providers/aws.ts
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function uploadMusicToS3(file: File): Promise<string> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: `music/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}

// Get signed URL for private files
export async function getSignedMusicUrl(key: string, expiresIn: number = 3600): Promise<string> {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: expiresIn,
  });
}
```

### Cloudinary Example

```typescript
// lib/music-providers/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadMusicToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resource_type', 'video'); // Cloudinary treats audio as video
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await response.json();
  return data.secure_url;
}
```

## License Attribution

When using music from different sources, remember licensing:

```typescript
interface MusicTrack {
  // ... existing fields ...
  license?: {
    type: "cc0" | "cc-by" | "cc-by-sa" | "proprietary";
    attribution?: string;
    url?: string;
  };
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "cc-track-1",
    name: "Free Royalty Music",
    artist: "Creator Name",
    duration: 180,
    url: "https://example.com/song.mp3",
    genre: "Electronic",
    mood: "Chill",
    license: {
      type: "cc0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
  },
];

// Helper to get attribution text
export function getAttributionText(track: MusicTrack): string {
  if (!track.license) return "";
  
  const types = {
    "cc0": "Public Domain",
    "cc-by": "CC BY",
    "cc-by-sa": "CC BY-SA",
    "proprietary": "All Rights Reserved",
  };
  
  return `${track.name} by ${track.artist} - ${types[track.license.type]}`;
}
```

## Caching Strategy

Cache frequently used libraries:

```typescript
// lib/music-cache.ts
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedMusicLibrary(): Promise<MusicTrack[]> {
  const cached = localStorage.getItem("musicLibrary");
  const timestamp = localStorage.getItem("musicLibraryTimestamp");
  
  const now = Date.now();
  if (cached && timestamp && now - parseInt(timestamp) < CACHE_DURATION) {
    return JSON.parse(cached);
  }
  
  const tracks = await fetchMusicLibrary();
  localStorage.setItem("musicLibrary", JSON.stringify(tracks));
  localStorage.setItem("musicLibraryTimestamp", String(now));
  
  return tracks;
}
```

## Usage Statistics

Track which music is most popular:

```typescript
// lib/music-analytics.ts
export interface MusicUsageStats {
  trackId: string;
  trackName: string;
  timesUsed: number;
  lastUsed: Date;
  avgDuration: number;
  exportedCount: number;
}

export async function recordMusicUsage(trackId: string) {
  const stats = await fetch(`/api/music-usage/${trackId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp: new Date(),
      videoDuration: videoDuration,
    }),
  });
  
  return stats.json();
}

export async function getMusicStats(): Promise<MusicUsageStats[]> {
  const response = await fetch("/api/music-usage/stats");
  return response.json();
}
```

## Recommendations Based on Video Type

```typescript
export function getRecommendedMusic(videoType: string): MusicTrack[] {
  const recommendations: Record<string, string[]> = {
    "vlog": ["Lo-Fi", "Indie", "Acoustic"],
    "tutorial": ["Lo-Fi", "Electronic", "Ambient"],
    "dance": ["Dance", "Electronic", "Pop"],
    "travel": ["Indie", "Acoustic", "Cinematic"],
    "comedy": ["Pop", "Indie", "Electronic"],
    "emotional": ["Acoustic", "Cinematic", "Ambient"],
    "product": ["Cinematic", "Electronic", "Pop"],
  };
  
  const moods = recommendations[videoType] || ["Pop"];
  
  return MUSIC_LIBRARY.filter(track =>
    moods.includes(track.genre)
  ).slice(0, 5);
}
```

## Environmental Variables

Add to `.env`:

```bash
# Music Library
MUSIC_API_URL=https://api.example.com/music
MUSIC_API_KEY=your_api_key_here

# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Apple Music
APPLE_MUSIC_TOKEN=your_token

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_UPLOAD_PRESET=your_preset
```

## Performance Tips

1. **Lazy Load Tracks** - Load trending first, then rest
2. **Use Thumbnails** - Cache album artwork
3. **Preload Audio** - Start loading audio when modal opens
4. **Compress Metadata** - Store minimal data in memory
5. **Pagination** - Load 20 tracks per page instead of all

## Testing Music Library

```typescript
// __tests__/music-library.test.ts
describe("Music Library", () => {
  it("should find tracks by search", () => {
    const results = searchMusicLibrary("summer");
    expect(results.length).toBeGreaterThan(0);
  });
  
  it("should filter by genre", () => {
    const electronic = getMusicByGenre("Electronic");
    expect(electronic.every(t => t.genre === "Electronic")).toBe(true);
  });
  
  it("should get trending tracks", () => {
    const trending = getTrendingMusic();
    expect(trending.every(t => t.trending === true)).toBe(true);
  });
});
```

---

**Ready to expand your music library! 🎶**
