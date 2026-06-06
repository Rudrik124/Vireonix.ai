import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, Download, Share2, FileVideo, Music, Volume2 } from "lucide-react";
import { useMusicContext } from "../../context/music-context";
import { estimateExportSize, formatFileSize } from "../../../lib/export-utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDuration: number;
  onExport: (options: ExportOptionsType) => Promise<void>;
  isExporting?: boolean;
}

export interface ExportOptionsType {
  format: "mp4" | "webm" | "mov";
  quality: "high" | "medium" | "low";
  includeMusic: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoDuration,
  onExport,
  isExporting = false,
}) => {
  const { selectedMusic } = useMusicContext();
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    format: "mp4",
    quality: "high",
    includeMusic: !!selectedMusic,
  });
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setError(null);
      await onExport(exportOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const estimatedSize = estimateExportSize(
    videoDuration,
    exportOptions.quality,
    exportOptions.includeMusic && !!selectedMusic
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0f1724] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileVideo className="w-5 h-5 text-purple-400" />
            Export Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Video Summary */}
          <Card className="bg-[#061018] border-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">Video Duration</h4>
                <p className="text-xs text-white/60">{formatTime(videoDuration)}</p>
              </div>
            </div>
          </Card>

          {/* Music Summary */}
          {selectedMusic && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{selectedMusic.name}</h4>
                  <p className="text-xs text-white/70 truncate">{selectedMusic.artist}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="bg-black/30 border-white/20 text-purple-300">
                  <Volume2 className="w-3 h-3 mr-1" />
                  {selectedMusic.volume}%
                </Badge>
                <Badge variant="outline" className="bg-black/30 border-white/20 text-purple-300">
                  {Math.floor((selectedMusic.endTime - selectedMusic.startTime) / 60)}:
                  {((selectedMusic.endTime - selectedMusic.startTime) % 60).toString().padStart(2, "0")}
                </Badge>
                {selectedMusic.muteOriginal && (
                  <Badge className="bg-amber-500/20 border-amber-500/50 text-amber-300">
                    🔇 Muted
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["mp4", "webm", "mov"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    variant={exportOptions.format === fmt ? "default" : "outline"}
                    onClick={() => setExportOptions({ ...exportOptions, format: fmt })}
                    className="text-xs uppercase"
                  >
                    {fmt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((q) => (
                  <Button
                    key={q}
                    variant={exportOptions.quality === q ? "default" : "outline"}
                    onClick={() => setExportOptions({ ...exportOptions, quality: q })}
                    className="text-xs capitalize"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>

            {/* Music Toggle */}
            {selectedMusic && (
              <div className="flex items-center gap-2 p-2 bg-[#061018] rounded-lg">
                <input
                  type="checkbox"
                  id="includeMusic"
                  checked={exportOptions.includeMusic}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeMusic: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="includeMusic" className="text-sm text-white flex-1 cursor-pointer">
                  Include Music in Export
                </label>
              </div>
            )}

            {/* File Size Estimate */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Estimated Size</span>
                <span className="text-blue-300 font-semibold">{estimatedSize}</span>
              </div>
              <p className="text-xs text-blue-300/70 mt-1">
                {exportOptions.quality === "high"
                  ? "Best quality, larger file"
                  : exportOptions.quality === "medium"
                    ? "Balanced quality and size"
                    : "Smaller file, lower quality"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-300 space-y-1">
              <p className="font-medium">💡 Export Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-purple-300/80">
                <li>Use HIGH quality for social media</li>
                <li>Use MEDIUM quality for web/preview</li>
                <li>Use LOW quality for faster export</li>
                <li>Music will sync automatically with video</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
