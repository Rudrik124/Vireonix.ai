import { useState, useEffect, useCallback, useMemo } from 'react';

export type AspectRatioConfig = {
  name: string;
  width: number;
  height: number;
};

const DEFAULT_RATIO: AspectRatioConfig = {
  name: "YouTube",
  width: 16,
  height: 9,
};

export const PRESET_RATIOS: Record<string, AspectRatioConfig> = {
  '16:9': { name: 'YouTube', width: 16, height: 9 },
  '9:16': { name: 'Instagram', width: 9, height: 16 },
  '1:1': { name: 'Square', width: 1, height: 1 },
  '4:5': { name: 'Portrait', width: 4, height: 5 },
  '3:4': { name: 'Portrait Classic', width: 3, height: 4 },
  '4:3': { name: 'Classic TV', width: 4, height: 3 },
  '21:9': { name: 'Cinematic', width: 21, height: 9 },
  '2.35:1': { name: 'Ultra Wide', width: 2.35, height: 1 },
};

export function useAspectRatio() {
  const [aspectRatio, setAspectRatioState] = useState<AspectRatioConfig>(() => {
    try {
      const stored = localStorage.getItem('veytrix_aspect_ratio');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored aspect ratio", e);
    }
    return DEFAULT_RATIO;
  });

  const applyAspectRatio = useCallback((width: number, height: number, name: string) => {
    const newValue = { width, height, name };
    setAspectRatioState(newValue);
    localStorage.setItem('veytrix_aspect_ratio', JSON.stringify(newValue));
  }, []);

  const formattedRatio = useMemo(() => {
    if (aspectRatio.name === 'Custom') {
      return 'Custom';
    }
    // Return standard formats if they match perfectly, otherwise compute value
    return `${aspectRatio.width}:${aspectRatio.height}`;
  }, [aspectRatio]);

  const getRatioValue = useCallback(() => {
    return aspectRatio.width / aspectRatio.height;
  }, [aspectRatio]);

  return {
    aspectRatio,
    applyAspectRatio,
    formattedRatio,
    getRatioValue
  };
}
