import { SmartRule, CollectionMatchOperator } from '../types';

export interface SmartRuleTemplate {
  id: string;
  name: string;
  description: string;
  rules: SmartRule[];
  matchOperator: CollectionMatchOperator;
}

export const SMART_RULE_TEMPLATES: SmartRuleTemplate[] = [
  {
    id: 'template-cinema-2000s',
    name: 'Modern Cinema & Films',
    description: 'Films released from 2000 onwards in your archive',
    matchOperator: 'all',
    rules: [
      { id: 'r1', field: 'type', operator: 'equals', value: 'film' },
      { id: 'r2', field: 'year', operator: 'greater_than_or_equal', value: 2000 }
    ]
  },
  {
    id: 'template-literature',
    name: 'Books & Literature',
    description: 'All literary works, novels, and non-fiction books',
    matchOperator: 'any',
    rules: [
      { id: 'r1', field: 'type', operator: 'equals', value: 'book' },
      { id: 'r2', field: 'category', operator: 'equals', value: 'Literature' }
    ]
  },
  {
    id: 'template-places-visit',
    name: 'Places I Want to Visit',
    description: 'Destinations, streets, and world architecture',
    matchOperator: 'any',
    rules: [
      { id: 'r1', field: 'type', operator: 'equals', value: 'place' },
      { id: 'r2', field: 'category', operator: 'equals', value: 'Travel' }
    ]
  },
  {
    id: 'template-blue-tones',
    name: 'Blue-Toned Visual References',
    description: 'Structures and artworks characterized by blue skies, cool palettes, and daylight',
    matchOperator: 'all',
    rules: [
      { id: 'r1', field: 'color', operator: 'contains', value: 'blue' }
    ]
  },
  {
    id: 'template-monolithic-architecture',
    name: 'Brutalist & Modern Architecture',
    description: 'Architectural references and concrete structures',
    matchOperator: 'any',
    rules: [
      { id: 'r1', field: 'tag', operator: 'contains', value: 'architecture' },
      { id: 'r2', field: 'text', operator: 'contains', value: 'brutalism' }
    ]
  },
  {
    id: 'template-sci-fi-concepts',
    name: 'Sci-Fi & Futuristic Concepts',
    description: 'Concept art, dystopian visuals, and cinema stills',
    matchOperator: 'any',
    rules: [
      { id: 'r1', field: 'category', operator: 'equals', value: 'Concept' },
      { id: 'r2', field: 'category', operator: 'equals', value: 'Sci-Fi' }
    ]
  }
];

export const AVAILABLE_FIELDS: { label: string; value: SmartRule['field']; description: string }[] = [
  { label: 'Artifact Category', value: 'category', description: 'Films, Literature, Visual, Travel, Music, Concept' },
  { label: 'Artifact Type', value: 'type', description: 'film, book, place, post, music, tv_show' },
  { label: 'Tags', value: 'tag', description: 'Tags assigned to the artifact' },
  { label: 'Title & Description', value: 'text', description: 'Text matching in title or description' },
  { label: 'Creator / Author / Director', value: 'creator', description: 'Author, filmmaker, or artist' },
  { label: 'Creation / Release Year', value: 'year', description: 'Publication year or release date' },
  { label: 'Color / Palette / Mood', value: 'color', description: 'Dominant tone or color mood (e.g. blue, dark, warm)' },
  { label: 'Personal Rating', value: 'rating', description: 'Star rating or average community score' },
  { label: 'Saved in Library', value: 'saved', description: 'Whether the item is saved to your personal vault' }
];

export const OPERATORS_BY_FIELD: Record<SmartRule['field'], { label: string; value: SmartRule['operator'] }[]> = {
  category: [
    { label: 'Equals', value: 'equals' },
    { label: 'Does Not Equal', value: 'not_equals' },
    { label: 'Contains', value: 'contains' }
  ],
  type: [
    { label: 'Equals', value: 'equals' },
    { label: 'Does Not Equal', value: 'not_equals' }
  ],
  tag: [
    { label: 'Includes Tag', value: 'contains' },
    { label: 'Excludes Tag', value: 'not_contains' },
    { label: 'Exact Tag', value: 'equals' }
  ],
  text: [
    { label: 'Contains Text', value: 'contains' },
    { label: 'Does Not Contain', value: 'not_contains' },
    { label: 'Starts With', value: 'starts_with' }
  ],
  creator: [
    { label: 'Contains', value: 'contains' },
    { label: 'Equals', value: 'equals' },
    { label: 'Is Known (Not Empty)', value: 'is_not_empty' }
  ],
  year: [
    { label: 'Equals', value: 'equals' },
    { label: 'Greater Than (After)', value: 'greater_than' },
    { label: 'Less Than (Before)', value: 'less_than' },
    { label: 'At Least (>=)', value: 'greater_than_or_equal' },
    { label: 'At Most (<=)', value: 'less_than_or_equal' },
    { label: 'Between Years', value: 'between' }
  ],
  color: [
    { label: 'Contains Tone / Color', value: 'contains' },
    { label: 'Excludes Tone / Color', value: 'not_contains' }
  ],
  rating: [
    { label: 'At Least (>=)', value: 'greater_than_or_equal' },
    { label: 'At Most (<=)', value: 'less_than_or_equal' },
    { label: 'Equals', value: 'equals' }
  ],
  saved: [
    { label: 'Is Saved', value: 'is_saved' },
    { label: 'Is Not Saved', value: 'is_not_saved' }
  ]
};

/**
 * Client-side smart rule evaluator for instant preview and offline fallback.
 */
export function evaluateSmartRulesClient(
  items: any[],
  rules: SmartRule[],
  matchOperator: CollectionMatchOperator = 'all',
  pinnedIds: string[] = [],
  excludedIds: string[] = []
): any[] {
  const pinnedSet = new Set(pinnedIds || []);
  const excludedSet = new Set(excludedIds || []);

  if (!rules || rules.length === 0) {
    return items.filter(it => pinnedSet.has(it.id) && !excludedSet.has(it.id));
  }

  const matched = items.filter(item => {
    const testRule = (rule: SmartRule): boolean => {
      const { field, operator, value, secondValue } = rule;
      const strVal = value !== undefined && value !== null ? String(value).toLowerCase().trim() : '';

      switch (field) {
        case 'type': {
          const itemType = (item.type || '').toLowerCase();
          if (operator === 'equals') return itemType === strVal;
          if (operator === 'not_equals') return itemType !== strVal;
          return false;
        }

        case 'category': {
          const itemCat = (item.category || '').toLowerCase();
          if (operator === 'equals') return itemCat === strVal;
          if (operator === 'not_equals') return itemCat !== strVal;
          if (operator === 'contains') return itemCat.includes(strVal);
          return false;
        }

        case 'tag': {
          const tags = Array.isArray(item.tags) ? item.tags.map((t: string) => t.toLowerCase()) : [];
          if (operator === 'contains' || operator === 'equals') {
            return tags.some((t: string) => t.includes(strVal) || t === strVal);
          }
          if (operator === 'not_contains') {
            return !tags.some((t: string) => t.includes(strVal) || t === strVal);
          }
          return false;
        }

        case 'text': {
          const title = (item.title || item.name || '').toLowerCase();
          const desc = (item.description || item.synopsis || '').toLowerCase();
          if (operator === 'contains') return title.includes(strVal) || desc.includes(strVal);
          if (operator === 'not_contains') return !title.includes(strVal) && !desc.includes(strVal);
          if (operator === 'starts_with') return title.startsWith(strVal);
          return false;
        }

        case 'creator': {
          const meta = item.metadata || {};
          const creator = (item.creator || meta.author || meta.director || meta.artist || '').toLowerCase();
          if (operator === 'is_not_empty') return creator.length > 0 && creator !== 'discovery-bot';
          if (operator === 'equals') return creator === strVal;
          if (operator === 'contains') return creator.includes(strVal);
          return false;
        }

        case 'year': {
          const meta = item.metadata || {};
          const rawYear = meta.year || meta.releaseYear || meta.publicationYear || item.publicationYear || item.releaseYear;
          const year = rawYear ? Number(rawYear) : null;
          if (year === null || isNaN(year)) return false;
          const target = Number(value);
          if (isNaN(target)) return false;

          if (operator === 'equals') return year === target;
          if (operator === 'greater_than') return year > target;
          if (operator === 'less_than') return year < target;
          if (operator === 'greater_than_or_equal') return year >= target;
          if (operator === 'less_than_or_equal') return year <= target;
          if (operator === 'between') {
            const end = Number(secondValue);
            if (isNaN(end)) return year >= target;
            return year >= Math.min(target, end) && year <= Math.max(target, end);
          }
          return false;
        }

        case 'rating': {
          const meta = item.metadata || {};
          const rating = meta.averageRating || meta.rating || item.averageRating;
          if (rating === undefined || rating === null) return false;
          const numRating = Number(rating);
          const target = Number(value);
          if (isNaN(target)) return false;

          if (operator === 'greater_than_or_equal') return numRating >= target;
          if (operator === 'less_than_or_equal') return numRating <= target;
          if (operator === 'equals') return numRating === target;
          return false;
        }

        case 'saved': {
          const isSaved = Boolean(item.isSaved || item.saved);
          if (operator === 'is_saved') return isSaved === true;
          if (operator === 'is_not_saved') return isSaved === false;
          return false;
        }

        case 'color': {
          const fullText = `${item.title || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
          if (operator === 'contains' || operator === 'equals') return fullText.includes(strVal);
          if (operator === 'not_contains') return !fullText.includes(strVal);
          return false;
        }

        default:
          return false;
      }
    };

    if (matchOperator === 'all') {
      return rules.every(testRule);
    } else {
      return rules.some(testRule);
    }
  });

  const finalMap = new Map();

  // Pinned items first
  for (const it of items) {
    if (pinnedSet.has(it.id) && !excludedSet.has(it.id)) {
      finalMap.set(it.id, { ...it, isPinned: true });
    }
  }

  // Matched items next
  for (const it of matched) {
    if (!excludedSet.has(it.id) && !finalMap.has(it.id)) {
      finalMap.set(it.id, { ...it, isPinned: false });
    }
  }

  return Array.from(finalMap.values());
}
