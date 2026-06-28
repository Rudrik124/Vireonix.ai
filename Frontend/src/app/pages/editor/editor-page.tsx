import React, { useState, useRef } from "react";
import { BrandLogo } from "../../components/brand-logo";
import TimelineTrack from "../../components/editor/timeline-track";
import { MusicProvider } from "../../context/music-context";
import { MusicPickerModal } from "../../components/editor/music-picker-modal";
import { MusicStrip } from "../../components/editor/music-strip";
import { ExportModal, ExportOptionsType } from "../../components/editor/export-modal";
import { Button } from "../../components/ui/button";
import { Music, Upload, Loader2 } from "lucide-react";
import { useMusicContext } from "../../context/music-context";
import { exportVideoWithMusic, downloadVideoBlob } from "../../../lib/export-utils";

function EditorPageContent() {
  const [videoDuration, setVideoDuration] = useState(20); // Default 20 seconds
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const { selectedMusic } = useMusicContext();
  const videoPreviewRef = useRef<HTMLDivElement>(null);

  const handleExport = async (options: ExportOptionsType) => {
    try {
      setIsExporting(true);
      setExportStatus("Preparing export...");

      // Simulate video path (in real app, this comes from the editor)
      const mockVideoPath = "/tmp/video.mp4";

      setExportStatus("Merging audio with video...");

      const result = await exportVideoWithMusic({
        videoPath: mockVideoPath,
        music: options.includeMusic && selectedMusic ? selectedMusic : undefined,
        videoDuration,
        format: options.format,
        quality: options.quality,
      });

      if (result.success && result.downloadUrl) {
        setExportStatus("Downloading...");

        // Convert URL to blob and download
        const response = await fetch(result.downloadUrl);
        const blob = await response.blob();

        const filename = `vireonix-${Date.now()}.${options.format}`;
        downloadVideoBlob(blob, filename);

        setExportStatus("Export complete!");
        setTimeout(() => {
          setIsExportModalOpen(false);
          setExportStatus(null);
        }, 2000);
      } else {
        throw new Error(result.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus(null);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0B1020] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} />
          <h1 className="text-xl font-bold">Veytrix Editor</h1>
        </div>
        <div className="text-sm text-white/80">Quick Export • Mixer • Timeline</div>
      </div>

      <div className="flex h-[calc(100vh-72px)]">
        {/* Left panel: Media Pool + Effects */}
        <aside className="w-80 bg-[#0f1724] border-r border-white/5 p-4 overflow-auto">
          <h2 className="text-sm font-semibold mb-2">Media Pool</h2>
          <div className="grid grid-cols-1 gap-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="bg-[#0b1220] rounded-md p-2 flex items-center gap-2">
                <div className="w-16 h-10 bg-gray-700 rounded-sm" />
                <div className="flex-1">
                  <div className="text-xs font-medium">Clip {i}</div>
                  <div className="text-[11px] text-white/60">00:00:0{i}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-6 mb-2 text-sm font-semibold">Effects / Transitions</h3>
          <div className="space-y-2">
            {['Tunnel of Light','Stretch Blur','Spin','Tile Wipe','Warp'].map((e) => (
              <div key={e} className="text-sm bg-[#071025] p-2 rounded-md">{e}</div>
            ))}
          </div>
        </aside>

        {/* Center: Preview on top, Timeline bottom */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="bg-black rounded-xl h-full border border-white/5 overflow-hidden flex">
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-[#0b1220] to-[#111827] flex items-center justify-center">
                  <div className="text-center text-white/60">Preview Area (video)</div>
                </div>
              </div>
              <div className="w-64 border-l border-white/5 p-4">
                <h4 className="text-sm font-semibold">Inspector</h4>
                <div className="mt-3 text-sm text-white/80">
                  Transform
                  <div className="mt-2 text-xs text-white/60">Zoom, Position, Rotation (placeholders)</div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-72 bg-[#071025] border-t border-white/5 p-4">
            <div className="h-full rounded-md bg-[#061018] p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Timeline</div>
                <div className="text-xs text-white/60">Zoom • Snap • Markers</div>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="space-y-3">
                  <TimelineTrack
                    label="Video 1"
                    clips={[
                      { id: 'c1', label: 'Hiking 1', start: 0, duration: 12 },
                      { id: 'c2', label: 'Hiking 2', start: 14, duration: 8 },
                    ]}
                    onChange={(clips) => console.log('video clips', clips)}
                  />

                  <TimelineTrack
                    label="Audio 1"
                    clips={[{ id: 'a1', label: 'Music', start: 0, duration: 40, color: 'linear-gradient(90deg,#10b981,#84cc16)' }]}
                    onChange={(clips) => console.log('audio clips', clips)}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right panel: Metadata / Export */}
        <aside className="w-80 bg-[#0f1724] border-l border-white/5 p-4 overflow-auto">
          <h3 className="mb-3 text-sm font-semibold">Metadata</h3>
          <div className="text-xs text-white/60 mb-4">Filename: Hiking_1.mp4</div>

          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Format</div>
            <div className="text-xs text-white/60">16:9 • 60FPS • H.264</div>
          </div>

          {/* Music Section */}
          <div className="mb-6 pb-6 border-b border-white/10">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" />
              Background Music
            </div>
            
            <Button
              onClick={() => setIsMusicPickerOpen(true)}
              className="w-full mb-3 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4" />
              Add Music
            </Button>

            {/* Music Strip */}
            <MusicStrip videoDuration={videoDuration} />
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Export</div>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              disabled={isExporting}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {exportStatus}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Quick Export
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-xs text-white/50">Audio tracks are now part of the Timeline below for editing.</div>
        </aside>
      </div>

      {/* Music Picker Modal */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        videoDuration={videoDuration}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoDuration={videoDuration}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}

export function EditorPage() {
  return (
    <MusicProvider>
      <EditorPageContent />
    </MusicProvider>
  );
}

export default EditorPage;
