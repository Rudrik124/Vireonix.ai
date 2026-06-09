import React, { createContext, useContext, useState, useCallback } from "react";

export interface SelectedMusic {
  id: string;
  name: string;
  artist: string;
  duration: number; // in seconds
  source: "library" | "device"; // where the music came from
  url?: string; // for library tracks
  file?: File; // for device uploads
  volume: number; // 0-100
  startTime: number; // trim start in seconds
  endTime: number; // trim end in seconds
  muteOriginal: boolean; // whether to mute original video audio
}

interface MusicContextType {
  selectedMusic: SelectedMusic | null;
  setSelectedMusic: (music: SelectedMusic | null) => void;
  updateMusicSettings: (settings: Partial<SelectedMusic>) => void;
  clearMusic: () => void;
  isPreviewPlaying: boolean;
  setIsPreviewPlaying: (playing: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusic | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const updateMusicSettings = useCallback((settings: Partial<SelectedMusic>) => {
    setSelectedMusic((prev) => (prev ? { ...prev, ...settings } : null));
  }, []);

  const clearMusic = useCallback(() => {
    setSelectedMusic(null);
    setIsPreviewPlaying(false);
  }, []);

  const value: MusicContextType = {
    selectedMusic,
    setSelectedMusic,
    updateMusicSettings,
    clearMusic,
    isPreviewPlaying,
    setIsPreviewPlaying,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusicContext must be used within MusicProvider");
  }
  return context;
};
