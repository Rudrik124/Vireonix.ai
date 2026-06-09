// Scene and Image Generation Helper Functions

/**
 * Words to remove from prompts (quality/style descriptors)
 */
const QUALITY_WORDS = new Set([
  "cinematic", "4k", "ultra", "realistic", "hd", "highdef", "high-definition",
  "stunning", "beautiful", "amazing", "quality", "detailed", "volumetric",
  "lighting", "ray", "trace", "render", "style", "effect", "humanoid",
]);

/**
 * Common grammar words to filter
 */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "with", "to", "for", "by", "from",
  "is", "are", "was", "were", "that", "this", "it", "be", "have", "has", "had", "been",
  "but", "not", "as", "if", "so", "while", "during", "about", "would", "over", "under",
  "into", "out", "up", "down", "very", "just", "only", "such",
]);

/**
 * Extract nouns/meaningful keywords from prompt
 * @param {string} prompt - Input prompt
 * @returns {Array<string>} - Array of clean meaningful words
 */
function extractMeaningfulWords(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return [];
  }

  const words = prompt.toLowerCase().match(/[a-z0-9]+/g) || [];

  const meaningful = words.filter((w) => {
    // Filter: not stopwords, not quality words, length > 2
    return !STOPWORDS.has(w) && !QUALITY_WORDS.has(w) && w.length > 2;
  });

  return meaningful;
}

/**
 * Identify primary location/setting if present
 * @param {string} prompt - Input prompt
 * @returns {string|null} - Location word or null
 */
function extractLocation(prompt) {
  const locationPatterns = [
    /(?:in|inside|at|within)\s+(?:a|an|the)?\s*([a-z\s]+?)(?:\s+with|\s+and|$)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const location = match[1].toLowerCase().trim();
      const words = location.match(/[a-z0-9]+/g) || [];
      const meaningful = words.filter((w) => !STOPWORDS.has(w) && !QUALITY_WORDS.has(w) && w.length > 2)[0];
      return meaningful || null;
    }
  }

  return null;
}

/**
 * Generate 3-4 natural, stock-searchable queries
 * @param {string} prompt - Input prompt
 * @returns {Array<string>} - 3-4 different search queries
 */
export function generateUniqueSearchQueries(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return ["nature"];
  }

  let meaningfulWords = extractMeaningfulWords(prompt);

  if (meaningfulWords.length === 0) {
    return ["general"];
  }

  const location = extractLocation(prompt);

  // Remove location from meaningful words to avoid duplicates
  if (location) {
    meaningfulWords = meaningfulWords.filter((w) => w !== location);
  }

  const queries = [];

  // Query 1: Location + main subject
  if (location && meaningfulWords.length >= 1) {
    // e.g., "classroom students", "office businessman"
    queries.push(`${location} ${meaningfulWords[0]}`);
  } else if (meaningfulWords.length >= 2) {
    // e.g., "students classroom"
    queries.push(`${meaningfulWords[0]} ${meaningfulWords[1]}`);
  } else {
    queries.push(meaningfulWords[0]);
  }

  // Query 2: "[location] with [subject]" pattern
  if (location && meaningfulWords.length >= 1) {
    // e.g., "classroom with students"
    queries.push(`${location} with ${meaningfulWords[0]}`);
  } else if (meaningfulWords.length >= 2) {
    // e.g., "students working"
    queries.push(`${meaningfulWords[0]} ${meaningfulWords[1]}`);
  }

  // Query 3: Reverse order or different pattern
  if (meaningfulWords.length >= 2 && location) {
    // e.g., "students in classroom"
    queries.push(`${meaningfulWords[0]} in ${location}`);
  } else if (meaningfulWords.length >= 3) {
    // e.g., "students classroom studying"
    queries.push(`${meaningfulWords[0]} ${meaningfulWords[1]} ${meaningfulWords[2]}`);
  } else if (meaningfulWords.length >= 2) {
    queries.push(`${meaningfulWords[1]} ${meaningfulWords[0]}`);
  }

  // Query 4: Alternative combination with 3+ words
  if (meaningfulWords.length >= 3 && location) {
    // e.g., "classroom studying learning"
    queries.push(`${location} ${meaningfulWords[1]} ${meaningfulWords[2]}`);
  } else if (meaningfulWords.length >= 3) {
    // e.g., "studying students classroom"
    queries.push(`${meaningfulWords[1]} ${meaningfulWords[0]} ${meaningfulWords[2]}`);
  }

  // Filter duplicates and empty strings, limit to 4
  const unique = [...new Set(queries)].filter((q) => q && q.trim()).slice(0, 4);

  return unique.length > 0 ? unique : ["general"];
}

/**
 * Generate 3 scene descriptions from prompt
 * @param {string} prompt - Input prompt
 * @returns {Array<string>} - 3 scene descriptions
 */
export function generateScenes(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return [];
  }

  const cleaned = cleanPrompt(prompt);

  // Generate 3 different descriptions
  const scenes = [
    `Wide establishing shot of ${cleaned}`,
    `Close-up detail view of ${cleaned}`,
    `Alternative perspective of ${cleaned}`,
  ];

  return scenes.filter(Boolean);
}

/**
 * Fetch image from Unsplash API (PRIMARY SOURCE)
 * @param {string} query - Search query
 * @param {string} accessKey - Unsplash Access Key
 * @returns {Promise<string|null>} - Image URL or null
 */
export async function fetchImageFromUnsplash(query, accessKey) {
  if (!accessKey || !query) {
    return null;
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=landscape`, {
      headers: {
        "Authorization": `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Unsplash API error for "${query}": ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      console.log(`✅ Using Unsplash: "${query}"`);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.warn(`⚠️ Error fetching from Unsplash for "${query}":`, error.message);
    return null;
  }
}

/**
 * Fetch fallback image from picsum.photos
 * @param {string} query - Search query
 * @returns {string} - Fallback image URL
 */
export function getFallbackImage(query) {
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(query)}/1280/720`;
  console.log(`⚠️ Using fallback image for "${query}"`);
  return fallbackUrl;
}

/**
 * Generate scenes and fetch unique images for each scene
 * @param {string} prompt - User prompt
 * @param {string} unsplashAccessKey - Unsplash Access Key (primary source)
 * @returns {Promise<{scenes: Array, images: Array}>}
 */
export async function generateScenesWithImages(prompt, unsplashAccessKey) {
  if (!unsplashAccessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not configured. Please set it in .env file.");
  }

  // Step 1: Generate unique search queries
  const searchQueries = generateUniqueSearchQueries(prompt);
  console.log("🔍 Generated search queries:", searchQueries);

  // Step 2: Generate scene descriptions
  const scenes = generateScenes(prompt);

  if (scenes.length === 0) {
    throw new Error("Failed to generate scenes from prompt");
  }

  // Step 3: Fetch unique image for each search query
  const images = [];
  const fetchedUrls = new Set();

  for (let i = 0; i < searchQueries.length; i++) {
    const query = searchQueries[i];
    console.log(`🔍 Searching (${i + 1}/${searchQueries.length}): "${query}"`);

    let imageUrl = null;

    // Try Unsplash (primary source)
    imageUrl = await fetchImageFromUnsplash(query, unsplashAccessKey);

    // Fallback if Unsplash fails
    if (!imageUrl) {
      imageUrl = getFallbackImage(query);
    }

    // Check for duplicates
    if (imageUrl && !fetchedUrls.has(imageUrl)) {
      images.push(imageUrl);
      fetchedUrls.add(imageUrl);
      console.log(`✅ Image ${i + 1} fetched successfully`);
    } else if (imageUrl && fetchedUrls.has(imageUrl)) {
      console.log(`⚠️ Duplicate detected, modifying query for retry`);
      // Try with modified query to get different image
      const modifiedQuery = query + " different angle";
      const retryUrl = await fetchImageFromUnsplash(modifiedQuery, unsplashAccessKey);
      if (retryUrl && !fetchedUrls.has(retryUrl)) {
        images.push(retryUrl);
        fetchedUrls.add(retryUrl);
        console.log(`✅ Image ${i + 1} fetched (retry with modified query)`);
      } else {
        const fallbackUrl = getFallbackImage(modifiedQuery);
        if (!fetchedUrls.has(fallbackUrl)) {
          images.push(fallbackUrl);
          fetchedUrls.add(fallbackUrl);
          console.log(`✅ Image ${i + 1} fetched (fallback after retry)`);
        }
      }
    }
  }

  // Step 4: Validate minimum images requirement
  if (images.length < 2) {
    throw new Error(`Failed to fetch minimum 2 images. Got ${images.length} image(s).`);
  }

  console.log(`✅ Successfully fetched ${images.length} unique images`);

  return {
    scenes: scenes,
    images: images,
  };
}

export default {
  generateUniqueSearchQueries,
  generateScenes,
  fetchImageFromUnsplash,
  getFallbackImage,
  generateScenesWithImages,
};
