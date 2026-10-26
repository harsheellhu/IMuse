import db from '../db.js';

// Whitelisted rule fields and operators
export const ALLOWED_FIELDS = [
  'type',
  'category',
  'tag',
  'text',
  'creator',
  'year',
  'rating',
  'saved',
  'color'
];

export const ALLOWED_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'is_saved',
  'is_not_saved',
  'is_not_empty'
];

/**
 * Validate a rule object
 */
export function validateRule(rule) {
  if (!rule || typeof rule !== 'object') return false;
  if (!ALLOWED_FIELDS.includes(rule.field)) return false;
  if (!ALLOWED_OPERATORS.includes(rule.operator)) return false;
  return true;
}

/**
 * Validate an array of rules
 */
export function validateRules(rules) {
  if (!Array.isArray(rules)) return [];
  return rules.filter(validateRule);
}

/**
 * Evaluate smart collection rules against the database and return matching content items.
 * Handles parameters safely with SQLite parameterized queries and in-memory metadata parsing.
 */
export function evaluateSmartRules({ rules = [], matchOperator = 'all', pinnedIds = [], excludedIds = [], userId = 'u-demo' }) {
  const safeRules = validateRules(rules);
  const safeOperator = matchOperator === 'any' ? 'any' : 'all';
  const pinnedSet = new Set(Array.isArray(pinnedIds) ? pinnedIds : []);
  const excludedSet = new Set(Array.isArray(excludedIds) ? excludedIds : []);

  // Fetch all candidate content items with their tags and saved status
  // Using parameterized query
  const query = `
    SELECT 
      c.id, c.type, c.title, c.description, c.creator, c.image_url, c.source_url, 
      c.category, c.metadata, c.world_id, c.created_at, c.updated_at,
      GROUP_CONCAT(ct.tag, '|||') as tags_concat,
      CASE WHEN si.content_id IS NOT NULL THEN 1 ELSE 0 END as is_saved
    FROM content c
    LEFT JOIN content_tags ct ON c.id = ct.content_id
    LEFT JOIN saved_items si ON c.id = si.content_id AND si.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  const rows = db.prepare(query).all(userId);

  // Parse items
  const parsedItems = rows.map(row => {
    let meta = {};
    if (row.metadata) {
      try {
        meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch (e) {
        meta = {};
      }
    }
    const tags = row.tags_concat ? row.tags_concat.split('|||').filter(Boolean) : [];
    
    return {
      ...row,
      metadata: meta,
      tags,
      isSaved: Boolean(row.is_saved),
      imageUrl: row.image_url,
      // Extracted metadata fields for fast rule evaluation
      extractedYear: meta.year || meta.releaseYear || meta.publicationYear || null,
      extractedRating: meta.averageRating || meta.rating || null,
      extractedDirector: meta.director || null,
      extractedAuthor: meta.author || null
    };
  });

  // Evaluate matching items
  const matchedItems = parsedItems.filter(item => {
    // If no rules defined:
    if (safeRules.length === 0) {
      // In hybrid/manual, pinned items can still be included
      return pinnedSet.has(item.id);
    }

    const testRule = (rule) => {
      const { field, operator, value, secondValue } = rule;
      const strVal = (value !== undefined && value !== null) ? String(value).toLowerCase().trim() : '';

      switch (field) {
        case 'type': {
          const itemType = (item.type || '').toLowerCase();
          if (operator === 'equals') return itemType === strVal;
          if (operator === 'not_equals') return itemType !== strVal;
          if (operator === 'contains') return itemType.includes(strVal);
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
          const itemTags = item.tags.map(t => t.toLowerCase());
          if (operator === 'contains' || operator === 'equals') {
            return itemTags.some(t => t.includes(strVal) || t === strVal);
          }
          if (operator === 'not_contains') {
            return !itemTags.some(t => t.includes(strVal) || t === strVal);
          }
          return false;
        }

        case 'text': {
          const title = (item.title || '').toLowerCase();
          const desc = (item.description || '').toLowerCase();
          if (operator === 'contains') return title.includes(strVal) || desc.includes(strVal);
          if (operator === 'not_contains') return !title.includes(strVal) && !desc.includes(strVal);
          if (operator === 'starts_with') return title.startsWith(strVal);
          return false;
        }

        case 'creator': {
          const creator = (item.creator || '').toLowerCase();
          const author = (item.extractedAuthor || '').toLowerCase();
          const director = (item.extractedDirector || '').toLowerCase();
          const combined = `${creator} ${author} ${director}`.trim();

          if (operator === 'is_not_empty') return combined.length > 0 && combined !== 'discovery-bot';
          if (operator === 'equals') return creator === strVal || author === strVal || director === strVal;
          if (operator === 'contains') return combined.includes(strVal);
          if (operator === 'not_contains') return !combined.includes(strVal);
          return false;
        }

        case 'year': {
          const year = item.extractedYear !== null ? Number(item.extractedYear) : null;
          if (year === null || isNaN(year)) return false;
          const targetYear = Number(value);
          if (isNaN(targetYear)) return false;

          if (operator === 'equals') return year === targetYear;
          if (operator === 'greater_than') return year > targetYear;
          if (operator === 'less_than') return year < targetYear;
          if (operator === 'greater_than_or_equal') return year >= targetYear;
          if (operator === 'less_than_or_equal') return year <= targetYear;
          if (operator === 'between') {
            const endYear = Number(secondValue);
            if (isNaN(endYear)) return year >= targetYear;
            return year >= Math.min(targetYear, endYear) && year <= Math.max(targetYear, endYear);
          }
          return false;
        }

        case 'rating': {
          const rating = item.extractedRating !== null ? Number(item.extractedRating) : null;
          if (rating === null || isNaN(rating)) return false;
          const targetRating = Number(value);
          if (isNaN(targetRating)) return false;

          if (operator === 'greater_than_or_equal') return rating >= targetRating;
          if (operator === 'less_than_or_equal') return rating <= targetRating;
          if (operator === 'equals') return rating === targetRating;
          return false;
        }

        case 'saved': {
          if (operator === 'is_saved') return item.isSaved === true;
          if (operator === 'is_not_saved') return item.isSaved === false;
          return false;
        }

        case 'color': {
          // Check description, tags, and category for color mentions or mood keywords
          const text = `${item.title || ''} ${item.description || ''} ${item.tags.join(' ')}`.toLowerCase();
          if (operator === 'contains' || operator === 'equals') {
            return text.includes(strVal);
          }
          if (operator === 'not_contains') {
            return !text.includes(strVal);
          }
          return false;
        }

        default:
          return false;
      }
    };

    if (safeOperator === 'all') {
      return safeRules.every(testRule);
    } else {
      return safeRules.some(testRule);
    }
  });

  // Apply exclusions and pinned items
  const finalMap = new Map();

  // 1. First add pinned items that are not excluded
  for (const item of parsedItems) {
    if (pinnedSet.has(item.id) && !excludedSet.has(item.id)) {
      finalMap.set(item.id, { ...item, isPinned: true });
    }
  }

  // 2. Add rule-matched items that are not excluded
  for (const item of matchedItems) {
    if (!excludedSet.has(item.id) && !finalMap.has(item.id)) {
      finalMap.set(item.id, { ...item, isPinned: false });
    }
  }

  return Array.from(finalMap.values());
}
