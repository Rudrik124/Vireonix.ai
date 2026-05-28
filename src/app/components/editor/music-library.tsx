import React, { useState, useMemo } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Music, Play, Pause, Search, Flame, Grid2X2, List } from "lucide-react";
import {
  MUSIC_LIBRARY,
  searchMusicLibrary,
  getTrendingMusic,
  getMusicByGenre,
  getMusicByMood,
  getGenres,
  getMoods,
  MusicTrack,
} from "../../../lib/music-library";
import { useMusicContext, SelectedMusic } from "../../context/music-context";

interface MusicLibraryProps {
  videoDuration: number;
  onSelectTrack?: (track: SelectedMusic) => void;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({ videoDuration, onSelectTrack }) => {
  const { setSelectedMusic, isPreviewPlaying, setIsPreviewPlaying } = useMusicContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const previewAudioRef = React.useRef<HTMLAudioElement>(null);

  const genres = useMemo(() => getGenres(), []);
  const moods = useMemo(() => getMoods(), []);

  // Filter logic
  const filteredTracks = useMemo(() => {
    let tracks = searchQuery ? searchMusicLibrary(searchQuery) : MUSIC_LIBRARY;

    if (selectedGenre) {
      tracks = tracks.filter((t) => t.genre === selectedGenre);
    }

    if (selectedMood) {
      tracks = tracks.filter((t) => t.mood === selectedMood);
    }

    return tracks;
  }, [searchQuery, selectedGenre, selectedMood]);

  const handleSelectTrack = (track: MusicTrack) => {
    const selectedMusic: SelectedMusic = {
      id: track.id,
      name: track.name,
      artist: track.artist,
      duration: track.duration,
      source: "library",
      url: track.url,
      volume: 80,
      startTime: 0,
      endTime: Math.min(track.duration, videoDuration),
      muteOriginal: false,
    };

    setSelectedMusic(selectedMusic);
    onSelectTrack?.(selectedMusic);
  };

  const handlePlayPreview = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingTrackId === track.id && isPreviewPlaying) {
      // Stop playing
      previewAudioRef.current?.pause();
      setIsPreviewPlaying(false);
      setPlayingTrackId(null);
    } else {
      // Start playing
      if (previewAudioRef.current) {
        previewAudioRef.current.src = track.url;
        previewAudioRef.current.play();
        setIsPreviewPlaying(true);
        setPlayingTrackId(track.id);
      }
    }
  };

  const TrackCard = ({ track }: { track: MusicTrack }) => (
    <div
      onClick={() => handleSelectTrack(track)}
      className="group bg-[#0f1724] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-cyan-400/30 transition-all hover:bg-[#0f1724]/80 space-y-2"
    >
      {/* Track Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate text-white group-hover:text-cyan-400 transition">
            {track.name}
          </h4>
          <p className="text-xs text-white/60 truncate">{track.artist}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handlePlayPreview(track, e)}
          className="h-8 w-8 p-0"
        >
          {playingTrackId === track.id && isPreviewPlaying ? (
            <Pause className="w-4 h-4 text-cyan-400" />
          ) : (
            <Play className="w-4 h-4 text-white/60 group-hover:text-cyan-400" />
          )}
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-300">
          {track.genre}
        </Badge>
        <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300">
          {track.mood}
        </Badge>
        {track.bpm && (
          <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300">
            {track.bpm} BPM
          </Badge>
        )}
        {track.trending && (
          <Badge className="text-xs bg-red-500/20 border-red-500/50 text-red-300 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Trending
          </Badge>
        )}
      </div>

      {/* Duration */}
      <div className="text-xs text-white/50">
        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
      </div>
    </div>
  );

  const TrackListItem = ({ track }: { track: MusicTrack }) => (
    <div
      onClick={() => handleSelectTrack(track)}
      className="group bg-[#0f1724] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-cyan-400/30 transition-all flex items-center justify-between"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{track.name}</h4>
          <div className="flex items-center gap-2">
            <p className="text-xs text-white/60 truncate">{track.artist}</p>
            <span className="text-xs text-white/40">•</span>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300">
              {track.genre}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-white/60">
          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handlePlayPreview(track, e)}
          className="h-8 w-8 p-0"
        >
          {playingTrackId === track.id && isPreviewPlaying ? (
            <Pause className="w-4 h-4 text-cyan-400" />
          ) : (
            <Play className="w-4 h-4 text-white/60" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Hidden Audio Element for Previews */}
      <audio ref={previewAudioRef} onEnded={() => setPlayingTrackId(null)} />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by song, artist, genre, mood..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#061018] border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
          >
            <Grid2X2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-xs text-white/60">{filteredTracks.length} tracks</span>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Genre Filter */}
        {genres.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/80">Genre</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedGenre === null ? "default" : "outline"}
                  onClick={() => setSelectedGenre(null)}
                  className="text-xs"
                >
                  All
                </Button>
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    size="sm"
                    variant={selectedGenre === genre ? "default" : "outline"}
                    onClick={() => setSelectedGenre(genre)}
                    className="text-xs"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Mood Filter */}
        {moods.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/80">Mood</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedMood === null ? "default" : "outline"}
                  onClick={() => setSelectedMood(null)}
                  className="text-xs"
                >
                  All
                </Button>
                {moods.map((mood) => (
                  <Button
                    key={mood}
                    size="sm"
                    variant={selectedMood === mood ? "default" : "outline"}
                    onClick={() => setSelectedMood(mood)}
                    className="text-xs"
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex-1 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          <ScrollArea className="h-[400px] w-full">
            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 pr-4" : "space-y-2 pr-4"}>
              {filteredTracks.length > 0 ? (
                filteredTracks.map((track) =>
                  viewMode === "grid" ? (
                    <TrackCard key={track.id} track={track} />
                  ) : (
                    <TrackListItem key={track.id} track={track} />
                  )
                )
              ) : (
                <div className="col-span-full py-8 text-center text-white/60">
                  No tracks found. Try adjusting your filters.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="trending" className="space-y-3">
          <ScrollArea className="h-[400px] w-full">
            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 pr-4" : "space-y-2 pr-4"}>
              {getTrendingMusic().length > 0 ? (
                getTrendingMusic().map((track) =>
                  viewMode === "grid" ? (
                    <TrackCard key={track.id} track={track} />
                  ) : (
                    <TrackListItem key={track.id} track={track} />
                  )
                )
              ) : (
                <div className="col-span-full py-8 text-center text-white/60">
                  No trending tracks available.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
