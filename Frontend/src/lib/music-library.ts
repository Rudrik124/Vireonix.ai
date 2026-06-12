import { buildApiUrl } from "./api";

// Sample music library with Instagram-style tracks
export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // in seconds
  url: string; // URL to audio file
  genre: string;
  mood: string;
  bpm?: number;
  cover?: string;
  trending?: boolean;
}

// Sample library - in production, this would come from an API
export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "trending-1",
    name: "Midnight Vibes",
    artist: "Neon Lights",
    duration: 30,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Electronic",
    mood: "Chill",
    bpm: 120,
    trending: true,
  },
  {
    id: "trending-2",
    name: "Summer Dreams",
    artist: "Wave Riders",
    duration: 45,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "Pop",
    mood: "Happy",
    bpm: 128,
    trending: true,
  },
  {
    id: "trending-3",
    name: "Urban Beats",
    artist: "City Sounds",
    duration: 60,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "Hip-Hop",
    mood: "Energetic",
    bpm: 95,
    trending: true,
  },
  {
    id: "lofi-1",
    name: "Lofi Study",
    artist: "Chill Beats",
    duration: 180,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Lo-Fi",
    mood: "Relaxed",
    bpm: 85,
  },
  {
    id: "lofi-2",
    name: "Rainy Day",
    artist: "Beat Maker",
    duration: 120,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Lo-Fi",
    mood: "Melancholic",
    bpm: 80,
  },
  {
    id: "upbeat-1",
    name: "Festival Energy",
    artist: "DJ Sonic",
    duration: 90,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    genre: "Dance",
    mood: "Energetic",
    bpm: 130,
  },
  {
    id: "indie-1",
    name: "Summer Indie",
    artist: "Indie Vibes",
    duration: 180,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    genre: "Indie",
    mood: "Uplifting",
    bpm: 100,
  },
  {
    id: "cinematic-1",
    name: "Epic Moments",
    artist: "Orchestral Dreams",
    duration: 120,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    genre: "Cinematic",
    mood: "Dramatic",
    bpm: 90,
  },
  {
    id: "acoustic-1",
    name: "Acoustic Sunset",
    artist: "String Theory",
    duration: 150,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    genre: "Acoustic",
    mood: "Calm",
    bpm: 75,
  },
];

// Helper functions
export const searchMusicLibrary = (query: string): MusicTrack[] => {
  const lowerQuery = query.toLowerCase();
  return MUSIC_LIBRARY.filter(
    (track) =>
      track.name.toLowerCase().includes(lowerQuery) ||
      track.artist.toLowerCase().includes(lowerQuery) ||
      track.genre.toLowerCase().includes(lowerQuery) ||
      track.mood.toLowerCase().includes(lowerQuery)
  );
};

export const getTrendingMusic = (): MusicTrack[] => {
  return MUSIC_LIBRARY.filter((track) => track.trending);
};

export const getMusicByGenre = (genre: string): MusicTrack[] => {
  return MUSIC_LIBRARY.filter((track) => track.genre.toLowerCase() === genre.toLowerCase());
};

export const getMusicByMood = (mood: string): MusicTrack[] => {
  return MUSIC_LIBRARY.filter((track) => track.mood.toLowerCase() === mood.toLowerCase());
};

export const getGenres = (): string[] => {
  return Array.from(new Set(MUSIC_LIBRARY.map((track) => track.genre)));
};

export const getMoods = (): string[] => {
  return Array.from(new Set(MUSIC_LIBRARY.map((track) => track.mood)));
};

// Fetch music dynamically (supports Feed.fm proxy with local mock fallback)
export const fetchMusicLibrary = async (query = ""): Promise<MusicTrack[]> => {
  try {
    const url = new URL(buildApiUrl("/api/music/tracks"));
    if (query) {
      url.searchParams.set("q", query);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data.tracks || [];
  } catch (error) {
    console.warn("⚠️ [music-library] Failed to fetch live music, falling back to mock catalog:", error.message || error);
    return query ? searchMusicLibrary(query) : MUSIC_LIBRARY;
  }
};
