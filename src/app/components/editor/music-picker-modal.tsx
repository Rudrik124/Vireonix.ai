import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Upload, Music } from "lucide-react";
import { MusicLibrary } from "./music-library";
import { useMusicContext, SelectedMusic } from "../../context/music-context";

interface MusicPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDuration: number;
}

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  isOpen,
  onClose,
  videoDuration,
}) => {
  const { setSelectedMusic } = useMusicContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/aac", "audio/mp4"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload an MP3, WAV, or AAC file");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File size must be less than 100MB");
      return;
    }

    // Read file duration
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      const selectedMusic: SelectedMusic = {
        id: `device-${Date.now()}`,
        name: file.name.replace(/\.[^.]*$/, ""), // Remove extension
        artist: "Device Upload",
        duration: audio.duration,
        source: "device",
        file: file,
        url: URL.createObjectURL(file),
        volume: 80,
        startTime: 0,
        endTime: Math.min(audio.duration, videoDuration),
        muteOriginal: false,
      };

      setSelectedMusic(selectedMusic);
      onClose();
    };

    audio.onerror = () => {
      setUploadError("Failed to read audio file. Please try another file.");
    };

    audio.src = URL.createObjectURL(file);
  };

  const handleLibrarySelect = (music: SelectedMusic) => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0f1724] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Music className="w-5 h-5 text-purple-400" />
            Add Music to Your Video
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="library" className="flex-1">
              Music Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              Upload Audio
            </TabsTrigger>
          </TabsList>

          {/* Music Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <MusicLibrary videoDuration={videoDuration} onSelectTrack={handleLibrarySelect} />
          </TabsContent>

          {/* Upload Audio Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-purple-400/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/aac,audio/mp4,.mp3,.wav,.aac,.m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-sm font-medium text-white">Click to upload or drag and drop</p>
                <p className="text-xs text-white/60 mt-1">
                  MP3, WAV, or AAC files up to 100MB
                </p>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                  {uploadError}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2 text-sm text-blue-300">
                <p className="font-medium">💡 Tips for uploading audio:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Upload audio files in MP3, WAV, or AAC format</li>
                  <li>Maximum file size is 100MB</li>
                  <li>Audio will be automatically trimmed to match your video duration</li>
                  <li>You can adjust volume, trim, and mute original audio in the editor</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="bg-[#061018] border-t border-white/5 -mx-6 -mb-6 px-6 py-3 text-xs text-white/60">
          Video duration: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, "0")}
        </div>
      </DialogContent>
    </Dialog>
  );
};
