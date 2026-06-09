export type Scene = {
  visual: string;
  keywords: string;
  duration: number;
  perspective?: "wide" | "close-up" | "top-view" | "detail";
  caption?: string;
};

const STOPWORDS = new Set([
  'a','an','the','and','or','of','in','on','at','with','to','for','by','from','is','are','was','were','that','this','these','those','as','it','its','be','being','have','has','had','but','not','into','while','during','my','your','their','its'
]);

// Words to exclude from image search (descriptive, not searchable)
const EXCLUDE_WORDS = new Set([
  'cinematic', 'realistic', 'lighting', 'ultra', 'detailed', 'quality', 'smooth',
  'volumetric', 'motion', 'dynamic', 'dramatic', 'stunning', 'beautiful', 'amazing',
  'high', 'ray', 'trace', 'render', 'style', 'effect', 'texture', 'ambient'
]);

function extractKeywords(prompt: string): string[] {
  const words = (prompt || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (STOPWORDS.has(w) || EXCLUDE_WORDS.has(w)) continue;
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
    if (out.length >= 6) break;
  }
  return out;
}

function findAction(prompt: string): string | null {
  const m = prompt.match(/\b\w+ing(?: \w+){0,2}\b/i);
  return m ? m[0].toLowerCase() : null;
}

function findLocation(prompt: string): string | null {
  const m = prompt.match(/(?:in|on|at|inside|within|near) (?:a |an |the )?([\w\s]{1,50})/i);
  if (!m) return null;
  return m[1].split(/[.,;]\s*/)[0].trim().toLowerCase();
}

/**
 * Generate 3 clean search queries for image fetching
 * Returns human-readable search terms, not visual descriptions
 * 
 * Example:
 * Input: "robot teaching students in classroom"
 * Output: [
 *   "classroom students",
 *   "teacher teaching class", 
 *   "students studying classroom"
 * ]
 */
export function generateScenesFromPrompt(prompt: string): Scene[] {
  if (!prompt || typeof prompt !== 'string') return [];
  const normalized = prompt.trim();
  
  const action = findAction(normalized);
  const location = findLocation(normalized);
  const keywords = extractKeywords(normalized);
  const subject = keywords.slice(0, 2).join(' ') || 'people';

  // Generate 3 clean search queries (not visual descriptions)
  const queries: string[] = [];

  // Query 1: Location + Subject
  if (location) {
    queries.push(`${location} ${subject}`);
  } else {
    queries.push(subject);
  }

  // Query 2: Action + Subject
  if (action) {
    const actionBase = action.replace(/ing$/, '');
    queries.push(`${actionBase} ${subject}`);
  } else if (keywords.length > 1) {
    queries.push(`${keywords[0]} ${keywords[1]}`);
  } else {
    queries.push(`${subject} activity`);
  }

  // Query 3: Varied combination
  if (location && action) {
    const actionBase = action.replace(/ing$/, '');
    queries.push(`${subject} ${actionBase} ${location}`);
  } else if (keywords.length > 2) {
    queries.push(`${keywords.slice(0, 3).join(' ')}`);
  } else if (location) {
    queries.push(`${subject} in ${location}`);
  } else {
    queries.push(`${subject} professional`);
  }

  // Remove duplicates and clean up
  const uniqueQueries = [...new Set(queries)].slice(0, 3);

  // Pad with defaults if needed
  while (uniqueQueries.length < 3) {
    uniqueQueries.push(subject);
  }

  console.log(`📋 [Scene Generation] Input: "${prompt}"`);
  console.log(`📋 [Scene Generation] Generated 3 search queries:`);
  uniqueQueries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

  return uniqueQueries.map((query, index) => ({
    visual: query, // Store the search query as visual
    keywords: query, // Use query for image search
    duration: 2.8,
    perspective: index === 0 ? 'wide' : index === 1 ? 'close-up' : 'detail',
    caption: `Scene ${index + 1}`
  }));
}

export default generateScenesFromPrompt;
