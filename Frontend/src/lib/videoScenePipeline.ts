import { generateScenesFromPrompt } from "./generateScenesFromPrompt";
import { scenesToImages } from "./scenesToImages";

export type VideoPayload = {
  width: number;
  height: number;
  quality: string;
  draft: boolean;
  scenes: Array<{
    duration: number;
    "background-color": string;
    elements: Array<{
      type: "image" | "text";
      src?: string;
      duration: number;
      // Motion effects
      transform?: {
        zoom?: {
          from?: number;
          to?: number;
        };
        pan?: {
          x?: number;
          y?: number;
        };
      };
      // Fade effects
      opacity?: {
        from?: number;
        to?: number;
      };
      // Text properties
      text?: string;
      fontSize?: number;
      fontColor?: string;
      position?: {
        x: number;
        y: number;
      };
      perspective?: "wide" | "close-up" | "top-view" | "detail";
    }>;
  }>;
};

/**
 * Builds a JSON2Video payload using visual scenes with cinematic motion effects
 * @param prompt User prompt to convert to visual scenes
 * @param duration Total video duration in seconds (default: 10)
 * @param aspectRatio Video aspect ratio (e.g., "16:9")
 * @returns JSON2Video API payload with image elements and cinematic effects
 */
export function buildVideoPayloadFromScenes(
  prompt: string,
  duration: number = 10,
  aspectRatio: string = "16:9"
): VideoPayload {
  // Normalize inputs
  const normalizedPrompt = String(prompt || "").trim();
  const safeDuration = Math.max(3, Math.min(180, Number(duration) || 10));
  
  // Map aspect ratios to dimensions
  const ratioMap: Record<string, { width: number; height: number }> = {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1440, height: 1080 },
    "3:4": { width: 1080, height: 1440 },
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 1080, height: 1350 },
    "2.35:1": { width: 1920, height: 816 },
  };
  
  const size = ratioMap[String(aspectRatio || "16:9")] || ratioMap["16:9"];

  // Generate visual scenes with cinematic variety
  const scenes = generateScenesFromPrompt(normalizedPrompt);
  
  // Convert scenes to image elements
  const videoSegments = scenesToImages(scenes);

  // Each segment now has its own duration from scene generation (2.5-3s)
  // Create elements with enhanced cinematic effects
  const elements = videoSegments.map((segment, index) => {
    const scene = scenes[index % scenes.length];
    const duration = scene?.duration || 2.8;
    
    // Vary zoom intensity based on perspective
    let zoomIntensity = 1.3; // Default cinematic zoom
    if (scene?.perspective === "wide") {
      zoomIntensity = 1.25; // Less zoom for wide shots
    } else if (scene?.perspective === "detail") {
      zoomIntensity = 1.4; // More zoom for close-ups
    } else if (scene?.perspective === "top-view") {
      zoomIntensity = 1.28; // Moderate zoom for aerial shots
    }
    
    // Vary pan direction pattern for visual interest
    const panPatterns = [
      { x: 40, y: -20 },  // right-up
      { x: -40, y: 20 },  // left-down
      { x: 20, y: 40 },   // up-left
      { x: -20, y: -40 }, // down-right
      { x: 50, y: 0 },    // horizontal pan
      { x: 0, y: 50 },    // vertical pan
    ];
    
    const panPattern = panPatterns[index % panPatterns.length];
    
    return {
      type: "image" as const,
      src: segment.src,
      duration: duration,
      // Cinematic Ken Burns effect with stronger zoom
      transform: {
        zoom: {
          from: 1.0,
          to: zoomIntensity,
        },
        pan: panPattern,
      },
      // Smooth fade in/out transitions
      opacity: {
        from: index === 0 ? 0 : 0.8, // Fade in
        to: index === videoSegments.length - 1 ? 0 : 0.9, // Fade out
      },
      perspective: scene?.perspective,
    };
  });

  // Add text overlay elements (captions)
  const textElements = videoSegments.map((segment, index) => {
    const scene = scenes[index % scenes.length];
    if (!scene?.caption) return null;
    
    const duration = scene?.duration || 2.8;
    
    return {
      type: "text" as const,
      text: scene.caption,
      duration: duration,
      fontSize: 48,
      fontColor: "#FFFFFF",
      position: {
        x: size.width / 2,
        y: scene?.perspective === "wide" ? size.height - 120 : size.height / 2,
      },
      opacity: {
        from: 0.7,
        to: 0.7,
      },
    };
  }).filter(Boolean) as any[];

  // Build final payload with all cinematic elements
  const totalDuration = videoSegments.reduce((sum, _, idx) => {
    return sum + (scenes[idx % scenes.length]?.duration || 2.8);
  }, 0);

  return {
    width: size.width,
    height: size.height,
    quality: "high",
    draft: false,
    scenes: [
      {
        duration: totalDuration,
        "background-color": "#0b1020",
        elements: [...elements, ...textElements],
      },
    ],
  };
}

export default buildVideoPayloadFromScenes;
