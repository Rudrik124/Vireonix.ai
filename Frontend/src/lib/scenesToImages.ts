export type VideoSegment = {
  type: "image";
  src: string;
  duration: number;
};

export type Scene = {
  keywords?: string;
  duration: number;
};

declare const process: any;

// Test mode: use hardcoded high-quality images if true
const USE_STATIC_IMAGES = process.env.VITE_USE_STATIC_IMAGES === "true" || process.env.USE_STATIC_IMAGES === "true";

// Static high-quality Unsplash images for testing
const STATIC_TEST_IMAGES = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop"
];

/**
 * Convert scenes to image URLs by fetching from Unsplash API
 * @param scenes - Array of scenes with search keywords
 * @returns Array of video segments with image URLs
 */
export function scenesToImages(scenes: Scene[]): VideoSegment[] {
  if (USE_STATIC_IMAGES) {
    console.log("🧪 [TEST MODE] Using static hardcoded images");
    return scenes.map((scene, index) => ({
      type: "image" as const,
      src: STATIC_TEST_IMAGES[index % STATIC_TEST_IMAGES.length],
      duration: scene.duration
    }));
  }

  return scenes.map((scene, index) => {
    const query = (scene.keywords || "technology").trim();
    
    // Return a placeholder that will be resolved server-side
    return {
      type: "image" as const,
      src: `SEARCH_QUERY:${query}:${index}`, // Mark for server-side processing
      duration: scene.duration
    };
  });
}

export default scenesToImages;
