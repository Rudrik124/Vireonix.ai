import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Music, X, Settings } from "lucide-react";
import { useMusicContext } from "../../context/music-context";
import { AudioEditControls } from "./audio-edit-controls";

interface MusicStripProps {
  videoDuration: number;
  onEditClick?: () => void;
}

export const MusicStrip: React.FC<MusicStripProps> = ({ videoDuration, onEditClick }) => {
  const { selectedMusic, clearMusic } = useMusicContext();
  const [showEditControls, setShowEditControls] = useState(false);

  if (!selectedMusic) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const musicDuration = selectedMusic.endTime - selectedMusic.startTime;

  return (
    <div className="space-y-3">
      {/* Music Summary Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{selectedMusic.name}</h4>
              <p className="text-xs text-white/70 truncate">{selectedMusic.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowEditControls(!showEditControls);
                onEditClick?.();
              }}
              className="h-8 w-8 p-0 hover:bg-purple-500/20"
              title="Edit audio"
            >
              <Settings className="w-4 h-4 text-purple-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearMusic}
              className="h-8 w-8 p-0 hover:bg-red-500/20"
              title="Remove music"
            >
              <X className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="bg-black/30 rounded px-2 py-1">
            <span className="text-white/70">Duration: </span>
            <span className="text-purple-400 font-semibold">{formatTime(musicDuration)}</span>
          </div>
          <div className="bg-black/30 rounded px-2 py-1">
            <span className="text-white/70">Volume: </span>
            <span className="text-purple-400 font-semibold">{selectedMusic.volume}%</span>
          </div>
          {selectedMusic.muteOriginal && (
            <div className="bg-black/30 rounded px-2 py-1">
              <span className="text-amber-300 font-semibold">🔇 Original muted</span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-black/40 rounded p-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Trim Range</span>
            <span className="text-purple-300">{formatTime(selectedMusic.startTime)} → {formatTime(selectedMusic.endTime)}</span>
          </div>
          <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-blue-500"
              style={{
                width: `${(musicDuration / selectedMusic.duration) * 100}%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* Edit Controls (Collapsible) */}
      {showEditControls && (
        <AudioEditControls
          videoDuration={videoDuration}
          onClose={() => setShowEditControls(false)}
        />
      )}
    </div>
  );
};
