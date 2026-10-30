/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Atmosphere Search Engine for iMuse
 * Implements natural-language mood and feeling discovery across:
 * - Emotional tone
 * - Environmental atmosphere
 * - Visual character
 * - Cultural and aesthetic associations
 * 
 * Features synonym mapping, multi-field weighted local ranking,
 * concept extraction, and transparent match explanations.
 */

export interface AtmosphereConcept {
  id: string;
  label: string;
  dimension: 'emotional' | 'environmental' | 'visual' | 'cultural';
  synonyms: string[];
}

export interface AtmosphereDimensionGroup {
  dimension: 'emotional' | 'environmental' | 'visual' | 'cultural';
  title: string;
  concepts: AtmosphereConcept[];
}

export interface AtmosphereMatchResult {
  score: number; // 0 to 1
  isMatch: boolean;
  matchedConcepts: string[];
  reasons: string[];
}

/**
 * Standard Canonical Atmosphere Vocabulary
 */
export const ATMOSPHERE_DIMENSIONS: AtmosphereDimensionGroup[] = [
  {
    dimension: 'emotional',
    title: 'Emotional Tone',
    concepts: [
      { id: 'nostalgic', label: 'Nostalgic', dimension: 'emotional', synonyms: ['wistful', 'memory', 'reminiscent', 'past', 'longing', 'yearning', 'retrospective', 'childhood'] },
      { id: 'melancholic', label: 'Melancholic', dimension: 'emotional', synonyms: ['melancholy', 'sad', 'somber', 'pensive', 'sorrowful', 'wistful', 'gloomy', 'bittersweet'] },
      { id: 'peaceful', label: 'Peaceful', dimension: 'emotional', synonyms: ['serene', 'calm', 'tranquil', 'quiet', 'stillness', 'zen', 'gentle', 'restful', 'soothing'] },
      { id: 'romantic', label: 'Romantic', dimension: 'emotional', synonyms: ['intimate', 'passion', 'tender', 'love', 'poetic', 'sensual', 'affectionate'] },
      { id: 'mysterious', label: 'Mysterious', dimension: 'emotional', synonyms: ['mystery', 'enigmatic', 'cryptic', 'secret', 'eerie', 'shadowy', 'hidden', 'intrigue'] },
      { id: 'dreamlike', label: 'Dreamlike', dimension: 'emotional', synonyms: ['dreamy', 'ethereal', 'hallucinatory', 'hypnotic', 'visionary', 'slumber', 'subconscious'] },
      { id: 'playful', label: 'Playful', dimension: 'emotional', synonyms: ['whimsical', 'lighthearted', 'joyful', 'quirky', 'vibrant', 'fun', 'colorful'] },
      { id: 'tense', label: 'Tense', dimension: 'emotional', synonyms: ['suspenseful', 'anxious', 'intense', 'nervous', 'gripping', 'thrilling', 'dramatic'] },
      { id: 'hopeful', label: 'Hopeful', dimension: 'emotional', synonyms: ['optimistic', 'uplifting', 'luminous', 'radiant', 'promising', 'inspiring'] },
      { id: 'isolated', label: 'Isolated', dimension: 'emotional', synonyms: ['solitude', 'lonely', 'alone', 'remote', 'secluded', 'alienated', 'solitary', 'abandoned'] },
      { id: 'comforting', label: 'Comforting', dimension: 'emotional', synonyms: ['cozy', 'warm', 'intimate', 'sheltered', 'homely', 'soothing', 'gentle', 'safe'] },
      { id: 'surreal', label: 'Surreal', dimension: 'emotional', synonyms: ['bizarre', 'unreal', 'strange', 'otherworldly', 'magical', 'illogical', 'fantastic'] }
    ]
  },
  {
    dimension: 'environmental',
    title: 'Environmental Atmosphere',
    concepts: [
      { id: 'rainy', label: 'Rainy', dimension: 'environmental', synonyms: ['rain', 'downpour', 'drizzle', 'wet', 'puddles', 'storm', 'monsoon', 'raindrops'] },
      { id: 'foggy', label: 'Foggy', dimension: 'environmental', synonyms: ['fog', 'mist', 'haze', 'smoky', 'dense', 'shrouded', 'vapor'] },
      { id: 'snowy', label: 'Snowy', dimension: 'environmental', synonyms: ['snow', 'winter', 'blizzard', 'frost', 'frozen', 'ice', 'cold', 'wintry'] },
      { id: 'windy', label: 'Windy', dimension: 'environmental', synonyms: ['breezy', 'gusty', 'wind', 'draft', 'stormy', 'blowing'] },
      { id: 'sunny', label: 'Sunny', dimension: 'environmental', synonyms: ['sunlight', 'bright', 'clear', 'sun-drenched', 'daylight', 'shining', 'warm'] },
      { id: 'overcast', label: 'Overcast', dimension: 'environmental', synonyms: ['cloudy', 'grey skies', 'gloomy', 'shadowed', 'dim', 'diffused'] },
      { id: 'humid', label: 'Humid', dimension: 'environmental', synonyms: ['tropical', 'hazy', 'damp', 'moist', 'summer heat', 'steamy'] },
      { id: 'misty', label: 'Misty', dimension: 'environmental', synonyms: ['mist', 'morning mist', 'vaporous', 'dew', 'dewy', 'fog'] },
      { id: 'nighttime', label: 'Nighttime', dimension: 'environmental', synonyms: ['night', 'midnight', 'nocturnal', 'darkness', 'moonlit', 'evening', 'after dark'] },
      { id: 'golden-hour', label: 'Golden Hour', dimension: 'environmental', synonyms: ['sunset', 'sundown', 'dusk', 'warm light', 'afternoon sun', 'magic hour', 'amber light'] },
      { id: 'dawn', label: 'Dawn', dimension: 'environmental', synonyms: ['sunrise', 'daybreak', 'morning', 'early morning', 'first light'] },
      { id: 'twilight', label: 'Twilight', dimension: 'environmental', synonyms: ['dusk', 'gloaming', 'nightfall', 'half-light', 'crepuscular', 'evening'] }
    ]
  },
  {
    dimension: 'visual',
    title: 'Visual Character',
    concepts: [
      { id: 'grainy', label: 'Grainy', dimension: 'visual', synonyms: ['film grain', 'textured', 'noise', 'analog texture', 'rough', 'grit', 'gritty'] },
      { id: 'hazy', label: 'Hazy', dimension: 'visual', synonyms: ['diffuse', 'blurred', 'soft', 'smoky', 'misty', 'vaporous', 'gauzy'] },
      { id: 'muted', label: 'Muted', dimension: 'visual', synonyms: ['desaturated', 'subdued', 'faded', 'washed out', 'understated', 'low contrast', 'tonal'] },
      { id: 'high-contrast', label: 'High Contrast', dimension: 'visual', synonyms: ['stark', 'chiaroscuro', 'deep shadows', 'dramatic lighting', 'punchy', 'bold'] },
      { id: 'soft-focus', label: 'Soft Focus', dimension: 'visual', synonyms: ['bokeh', 'dreamy blur', 'shallow depth', 'gentle', 'diffuse'] },
      { id: 'minimalist', label: 'Minimalist', dimension: 'visual', synonyms: ['minimal', 'sparse', 'clean', 'simple', 'uncluttered', 'monochrome', 'negative space'] },
      { id: 'ornate', label: 'Ornate', dimension: 'visual', synonyms: ['decorative', 'detailed', 'baroque', 'intricate', 'embellished', 'elaborate', 'gilded'] },
      { id: 'geometric', label: 'Geometric', dimension: 'visual', synonyms: ['angular', 'grids', 'lines', 'patterns', 'shapes', 'symmetric', 'architectonic'] },
      { id: 'organic', label: 'Organic', dimension: 'visual', synonyms: ['natural', 'flowing', 'curved', 'biological', 'earthy', 'botanical'] },
      { id: 'brutalist', label: 'Brutalist', dimension: 'visual', synonyms: ['brutalism', 'concrete', 'monolithic', 'raw', 'heavy', 'imposing', 'structural'] },
      { id: 'vintage', label: 'Vintage', dimension: 'visual', synonyms: ['antique', 'retro', 'aged', 'classic', 'period', 'heritage', 'patina', 'old'] }
    ]
  },
  {
    dimension: 'cultural',
    title: 'Cultural & Aesthetic Associations',
    concepts: [
      { id: 'film-noir', label: 'Film Noir', dimension: 'cultural', synonyms: ['noir', 'shadows', 'detective', 'rainy city', 'cynical', 'trenchcoat', 'venetian blinds'] },
      { id: 'dark-academia', label: 'Dark Academia', dimension: 'cultural', synonyms: ['library', 'oxford', 'tweed', 'scholarly', 'ancient books', 'classical', 'gothic university'] },
      { id: 'analog-photography', label: 'Analog Photography', dimension: 'cultural', synonyms: ['35mm', 'polaroid', 'kodak', 'darkroom', 'medium format', 'film roll', 'silver gelatin'] },
      { id: 'retro-futurism', label: 'Retro Futurism', dimension: 'cultural', synonyms: ['space age', 'atomic age', '1960s future', 'vintage sci-fi', 'cassette futurism'] },
      { id: 'modernism', label: 'Modernism', dimension: 'cultural', synonyms: ['bauhaus', 'mid-century', 'functionalism', 'international style', 'clean design'] },
      { id: 'mediterranean', label: 'Mediterranean', dimension: 'cultural', synonyms: ['amalfi', 'aegean', 'coastal', 'sunlit stone', 'terracotta tiles', 'olive trees', 'italian summer'] },
      { id: 'cyberpunk', label: 'Cyberpunk', dimension: 'cultural', synonyms: ['neon', 'blade runner', 'dystopian', 'high tech', 'cyber', 'futuristic city', 'tokyo night'] },
      { id: 'quiet-luxury', label: 'Quiet Luxury', dimension: 'cultural', synonyms: ['understated elegance', 'cashmere', 'old money', 'refined', 'subtle', 'art gallery'] },
      { id: 'postmodernism', label: 'Postmodernism', dimension: 'cultural', synonyms: ['memphis', 'ironic', 'deconstructivist', 'bold forms', 'eclectic'] },
      { id: 'romanticism', label: 'Romanticism', dimension: 'cultural', synonyms: ['sublime nature', 'poetic melancholy', 'dramatic landscape', 'byronic', 'pastoral'] }
    ]
  }
];

// Flat lookup map of all canonical concepts
export const ALL_CONCEPTS: AtmosphereConcept[] = ATMOSPHERE_DIMENSIONS.flatMap(g => g.concepts);

/**
 * Editorial Search Query Suggestions & Inspiration Sparks
 */
export const EDITORIAL_SEARCH_EXAMPLES: string[] = [
  'A rainy night in Tokyo',
  'Lonely blue cinema',
  'Warm Mediterranean summer',
  'An abandoned palace that feels like a dream',
  'Quiet libraries with old wooden interiors',
  'Nostalgic photographs from the early 2000s',
  'Brutalist architecture that feels futuristic',
  'A peaceful evening with soft jazz',
  'Places that feel like a memory',
  'Dark academia, but less gothic',
  'A winter evening in a city with warm lights',
  'Films that feel like a beautiful nightmare',
  'Soft, melancholic, and slightly surreal',
  'Minimalist architecture with a sense of isolation'
];

/**
 * Normalized tokenization helper
 */
export function tokenizeText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Identifies which canonical atmosphere concepts are referenced by a text query.
 */
export function extractQueryAtmosphereConcepts(query: string): AtmosphereConcept[] {
  const queryLower = query.toLowerCase();
  const tokens = tokenizeText(query);
  const matched: AtmosphereConcept[] = [];

  for (const concept of ALL_CONCEPTS) {
    // Check concept id or label
    if (queryLower.includes(concept.id.replace(/-/g, ' ')) || queryLower.includes(concept.label.toLowerCase())) {
      matched.push(concept);
      continue;
    }
    // Check synonyms
    const hasSynonym = concept.synonyms.some(syn => {
      if (syn.includes(' ')) {
        return queryLower.includes(syn);
      }
      return tokens.includes(syn);
    });

    if (hasSynonym) {
      matched.push(concept);
    }
  }

  return matched;
}

/**
 * Weighted local relevance ranker for atmosphere search.
 * 
 * Inspects:
 * - Title
 * - Description / Synopsis
 * - Tags / Moods
 * - Category / Discovery World
 * - Creator / Director / Author / Location
 * - Metadata properties
 * 
 * Weights:
 * - Exact mood-tag match: 3.5
 * - Description phrase match: 2.5
 * - Title match: 2.0
 * - Creator / Location: 1.8
 * - Category / World: 1.2
 */
export function evaluateArtifactAtmosphere(
  query: string,
  artifact: {
    id: string;
    type?: string;
    title?: string;
    name?: string;
    description?: string;
    synopsis?: string;
    tags?: string[];
    category?: string;
    creator?: string;
    author?: string;
    director?: string;
    location?: string;
    world_name?: string;
    metadata?: any;
  },
  explicitConcepts: AtmosphereConcept[] = []
): AtmosphereMatchResult {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery && explicitConcepts.length === 0) {
    return { score: 0, isMatch: false, matchedConcepts: [], reasons: [] };
  }

  const queryConcepts = explicitConcepts.length > 0 
    ? explicitConcepts 
    : extractQueryAtmosphereConcepts(cleanQuery);

  const queryTokens = tokenizeText(cleanQuery);

  const title = (artifact.title || artifact.name || '').toLowerCase();
  const desc = (artifact.description || artifact.synopsis || '').toLowerCase();
  const tags = (artifact.tags || []).map(t => t.toLowerCase());
  const category = (artifact.category || '').toLowerCase();
  const creator = (artifact.creator || artifact.author || artifact.director || '').toLowerCase();
  const location = (artifact.location || artifact.metadata?.location || '').toLowerCase();
  const worldName = (artifact.world_name || artifact.metadata?.worldName || '').toLowerCase();

  let rawScore = 0;
  const reasons: string[] = [];
  const matchedConceptNames: string[] = [];

  // 1. Direct Concept Matching (canonical tags & synonyms)
  for (const concept of queryConcepts) {
    let conceptMatched = false;
    const conceptTerms = [
      concept.id.replace(/-/g, ' '),
      concept.label.toLowerCase(),
      ...concept.synonyms
    ];

    // Check in Tags (Weight 3.5)
    for (const term of conceptTerms) {
      if (tags.some(t => t.includes(term))) {
        rawScore += 3.5;
        conceptMatched = true;
        reasons.push(`Tagged with "${concept.label}"`);
        break;
      }
    }

    // Check in Description (Weight 2.5)
    if (!conceptMatched) {
      for (const term of conceptTerms) {
        if (desc.includes(term)) {
          rawScore += 2.5;
          conceptMatched = true;
          reasons.push(`Evokes "${concept.label}" atmosphere`);
          break;
        }
      }
    }

    // Check in Title (Weight 2.0)
    if (!conceptMatched) {
      for (const term of conceptTerms) {
        if (title.includes(term)) {
          rawScore += 2.0;
          conceptMatched = true;
          reasons.push(`Title mentions "${concept.label}"`);
          break;
        }
      }
    }

    // Check in Category / World (Weight 1.2)
    if (!conceptMatched) {
      for (const term of conceptTerms) {
        if (category.includes(term) || worldName.includes(term)) {
          rawScore += 1.2;
          conceptMatched = true;
          reasons.push(`Belongs to "${concept.label}" mood world`);
          break;
        }
      }
    }

    if (conceptMatched) {
      matchedConceptNames.push(concept.label);
    }
  }

  // 2. Natural language tokens match (locations, names, specific nouns)
  const nonConceptTokens = queryTokens.filter(token => {
    // Filter out common stop words and pure concept tokens already handled
    const isStopWord = ['a', 'an', 'the', 'in', 'on', 'at', 'with', 'and', 'or', 'that', 'feels', 'like', 'from', 'but', 'less', 'more', 'of'].includes(token);
    return !isStopWord;
  });

  for (const token of nonConceptTokens) {
    if (title.includes(token)) {
      rawScore += 1.8;
      reasons.push(`Title matches "${token}"`);
    } else if (desc.includes(token)) {
      rawScore += 1.2;
      reasons.push(`Description matches "${token}"`);
    } else if (tags.some(t => t.includes(token))) {
      rawScore += 1.5;
      reasons.push(`Tag matches "${token}"`);
    } else if (location.includes(token)) {
      rawScore += 2.0;
      reasons.push(`Location matches "${token}"`);
    } else if (creator.includes(token)) {
      rawScore += 1.8;
      reasons.push(`Creator matches "${token}"`);
    }
  }

  // Exact phrase bonus if whole query appears in description or title
  if (cleanQuery.length > 4 && (desc.includes(cleanQuery) || title.includes(cleanQuery))) {
    rawScore += 3.0;
    reasons.push(`Direct phrase match`);
  }

  // Normalize score to 0..1
  // A raw score of 6.0 is considered a strong 90%+ match
  const normalizedScore = Math.min(1.0, Math.max(0, rawScore / 6.0));
  const isMatch = normalizedScore >= 0.25 || (queryConcepts.length > 0 && matchedConceptNames.length > 0);

  // Deduplicate and limit reasons for clean UI display
  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3);

  return {
    score: normalizedScore,
    isMatch,
    matchedConcepts: matchedConceptNames,
    reasons: uniqueReasons
  };
}
