import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Music, Volume2, Scissors, RotateCcw } from "lucide-react";
import { useMusicContext } from "../../context/music-context";

interface AudioEditControlsProps {
  videoDuration: number; // total video duration in seconds
  onClose?: () => void;
}

export const AudioEditControls: React.FC<AudioEditControlsProps> = ({ videoDuration, onClose }) => {
  const { selectedMusic, updateMusicSettings } = useMusicContext();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!selectedMusic) return null;

  const musicDuration = selectedMusic.endTime - selectedMusic.startTime;

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (value: number[]) => {
    updateMusicSettings({ volume: value[0] });
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleStartTimeChange = (value: number[]) => {
    const newStart = value[0];
    if (newStart < selectedMusic.endTime) {
      updateMusicSettings({ startTime: newStart });
      if (audioRef.current) {
        audioRef.current.currentTime = newStart;
      }
    }
  };

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = Math.min(value[0], selectedMusic.duration);
    if (newEnd > selectedMusic.startTime) {
      updateMusicSettings({ endTime: newEnd });
    }
  };

  const handleSyncWithVideo = () => {
    // Trim audio to match video duration
    updateMusicSettings({
      endTime: Math.min(selectedMusic.startTime + videoDuration, selectedMusic.duration),
    });
  };

  const handleToggleMute = () => {
    updateMusicSettings({ muteOriginal: !selectedMusic.muteOriginal });
  };

  const handleReset = () => {
    updateMusicSettings({
      startTime: 0,
      endTime: Math.min(selectedMusic.duration, videoDuration),
      volume: 80,
    });
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <Card className="w-full bg-[#0f1724] border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">{selectedMusic.name}</span>
          <span className="text-xs text-white/60">by {selectedMusic.artist}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        )}
      </div>

      {/* Audio Player */}
      {selectedMusic.url && (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={selectedMusic.url}
            onLoadedMetadata={(e) => {
              const audio = e.currentTarget;
              audio.volume = selectedMusic.volume / 100;
            }}
          />
          <div className="flex items-center gap-2 bg-[#061018] p-3 rounded-lg">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlayPause}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? "⏸" : "▶"}
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-white/60 min-w-fit">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{
                    width: `${selectedMusic.url ? (currentTime / selectedMusic.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-white/60 min-w-fit">{formatTime(selectedMusic.duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Volume Control */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="w-4 h-4 text-amber-400" />
          Volume: {selectedMusic.volume}%
        </label>
        <Slider
          value={[selectedMusic.volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Trim Audio */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Scissors className="w-4 h-4 text-blue-400" />
          Trim Audio ({formatTime(musicDuration)})
        </label>

        {/* Start Time */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/60">Start</span>
            <span className="text-xs text-purple-400">{formatTime(selectedMusic.startTime)}</span>
          </div>
          <Slider
            value={[selectedMusic.startTime]}
            onValueChange={handleStartTimeChange}
            min={0}
            max={selectedMusic.duration - 0.1}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* End Time */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/60">End</span>
            <span className="text-xs text-purple-400">{formatTime(selectedMusic.endTime)}</span>
          </div>
          <Slider
            value={[selectedMusic.endTime]}
            onValueChange={handleEndTimeChange}
            min={selectedMusic.startTime + 0.1}
            max={selectedMusic.duration}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>

      {/* Sync & Mute Options */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedMusic.muteOriginal ? "default" : "outline"}
          onClick={handleToggleMute}
          className="flex-1 text-xs"
        >
          {selectedMusic.muteOriginal ? "✓ Mute Original" : "Mute Original"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSyncWithVideo}
          className="flex-1 text-xs"
        >
          Sync with Video ({formatTime(videoDuration)})
        </Button>
      </div>

      {/* Reset Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReset}
        className="w-full text-xs flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-3 h-3" />
        Reset to Default
      </Button>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-xs text-blue-300">
        💡 Trimmed duration: {formatTime(musicDuration)} • Video duration: {formatTime(videoDuration)}
      </div>
    </Card>
  );
};
