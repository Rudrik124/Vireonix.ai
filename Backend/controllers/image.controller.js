import fetch from "node-fetch";

const toErrorMessage = (value, fallback = "Unexpected error") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  return String(value);
};

export const searchImage = async (req, res) => {
  const { query } = req.body;

  console.log(`\n📍 [/search-image] Endpoint called with query: "${query}"`);

  try {
    if (!query || !String(query).trim()) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    // Check if query contains complex keywords that would benefit from AI generation
    // Dummy isComplexPrompt for now if not imported
    const useAI = false; 
    
    console.log(`📍 [/search-image] isComplexPrompt result: ${useAI}`);
    
    if (useAI) {
      console.log(`🤖 [Search] Complex prompt detected, attempting AI generation for: "${query}"`);
      // const aiImage = await generateAIImage(query);
      const aiImage = null;
      
      console.log(`🤖 [Search] generateAIImage returned: ${aiImage ? "✅ IMAGE" : "❌ NULL"}`);
      
      if (aiImage) {
        return res.json({ 
          success: true, 
          image: aiImage, 
          source: "stability-ai" 
        });
      }
      
      console.log(`⚠️  [Search] AI generation failed, falling back to Unsplash`);
    }
    
    const unsplashAccessKey = process.env.UNSPLASH_API_KEY || process.env.UNSPLASH_ACCESS_KEY;
    
    if (!unsplashAccessKey) {
      console.error("❌ [Unsplash] Missing UNSPLASH_API_KEY environment variable");
      return res.status(500).json({ 
        success: false, 
        error: "Unsplash API key not configured. Please set UNSPLASH_API_KEY environment variable." 
      });
    }

    console.log(`🔍 [Unsplash] Searching for: "${query}"`);

    const searchResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&content_filter=high`,
      {
        method: "GET",
        headers: {
          "Authorization": `Client-ID ${unsplashAccessKey}`,
          "Accept-Version": "v1"
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Unsplash API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      console.warn(`⚠️  [Unsplash] No results found for query: "${query}"`);
      return res.json({
        success: true,
        image: `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`,
        source: "fallback"
      });
    }

    let selectedImage = null;
    for (const result of results) {
      const width = result.width;
      const height = result.height;
      const imageUrl = result.urls?.regular;

      if (!imageUrl) continue;

      if (width >= height) {
        selectedImage = imageUrl;
        break;
      }
    }

    if (!selectedImage) {
      return res.json({
        success: true,
        image: `https://picsum.photos/seed/${String(query).replace(/\s+/g, "-")}/1280/720`,
        source: "fallback"
      });
    }

    const optimizedImageUrl = `${selectedImage}?w=1280&h=720&fit=crop`;
    res.json({ success: true, image: optimizedImageUrl, source: "unsplash" });

  } catch (error) {
    console.error(`❌ [Unsplash] Error:`, toErrorMessage(error));
    const queryStr = req.body.query || "technology";
    const fallbackUrl = `https://picsum.photos/seed/${String(queryStr).replace(/\s+/g, "-")}/1280/720`;
    
    res.json({
      success: true,
      image: fallbackUrl,
      source: "fallback"
    });
  }
};
