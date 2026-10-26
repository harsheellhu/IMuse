import express from 'express';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { evaluateSmartRules, validateRules } from '../services/smartRuleEvaluator.js';

const router = express.Router();

const generateId = () => `c${Date.now()}${Math.floor(Math.random() * 1000)}`;

function formatCollection(c, computedItemCount = null) {
  let rules = [];
  try { rules = c.rules ? (typeof c.rules === 'string' ? JSON.parse(c.rules) : c.rules) : []; } catch (e) { rules = []; }
  
  let pinnedIds = [];
  try { pinnedIds = c.pinned_ids ? (typeof c.pinned_ids === 'string' ? JSON.parse(c.pinned_ids) : c.pinned_ids) : []; } catch (e) { pinnedIds = []; }
  
  let excludedIds = [];
  try { excludedIds = c.excluded_ids ? (typeof c.excluded_ids === 'string' ? JSON.parse(c.excluded_ids) : c.excluded_ids) : []; } catch (e) { excludedIds = []; }

  let manualOrder = [];
  try { manualOrder = c.manual_order ? (typeof c.manual_order === 'string' ? JSON.parse(c.manual_order) : c.manual_order) : []; } catch (e) { manualOrder = []; }

  return {
    id: c.id,
    title: c.title,
    description: c.description || '',
    coverImage: c.cover_image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
    isPrivate: Boolean(c.is_private),
    type: c.type || 'manual', // 'manual' | 'smart' | 'hybrid'
    matchOperator: c.match_operator || 'all', // 'all' | 'any'
    rules,
    pinnedIds,
    excludedIds,
    manualOrder,
    layout: c.layout || 'grid', // 'grid' | 'masonry' | 'editorial' | 'moodboard'
    itemCount: computedItemCount !== null ? computedItemCount : (c.itemCount || 0),
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

// Get user's collections with dynamic count calculation
router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    let rawCollections = db.prepare(`
      SELECT c.*, COUNT(ci.content_id) as manualItemCount 
      FROM collections c
      LEFT JOIN collection_items ci ON c.id = ci.collection_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `).all(userId);
    
    if (rawCollections.length === 0) {
      rawCollections = db.prepare(`
        SELECT c.*, COUNT(ci.content_id) as manualItemCount 
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT 15
      `).all();
    }

    const formatted = rawCollections.map(c => {
      let count = c.manualItemCount;
      if (c.type === 'smart' || c.type === 'hybrid') {
        const rules = c.rules ? (typeof c.rules === 'string' ? JSON.parse(c.rules) : c.rules) : [];
        const pinnedIds = c.pinned_ids ? (typeof c.pinned_ids === 'string' ? JSON.parse(c.pinned_ids) : c.pinned_ids) : [];
        const excludedIds = c.excluded_ids ? (typeof c.excluded_ids === 'string' ? JSON.parse(c.excluded_ids) : c.excluded_ids) : [];
        const evaluated = evaluateSmartRules({
          rules,
          matchOperator: c.match_operator,
          pinnedIds,
          excludedIds,
          userId
        });
        count = evaluated.length;
      }
      return formatCollection(c, count);
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Preview smart rules without saving
router.post('/preview-rules', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    const { rules = [], matchOperator = 'all', pinnedIds = [], excludedIds = [] } = req.body;
    
    const validated = validateRules(rules);
    const results = evaluateSmartRules({
      rules: validated,
      matchOperator,
      pinnedIds,
      excludedIds,
      userId
    });

    res.json({
      matchCount: results.length,
      items: results.slice(0, 50)
    });
  } catch (err) {
    console.error('Error previewing smart rules:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Create collection (manual, smart, or hybrid)
router.post('/', optionalAuth, (req, res) => {
  const { 
    title, 
    description, 
    is_private, 
    cover_image,
    type = 'manual', 
    match_operator = 'all', 
    rules = [], 
    pinned_ids = [], 
    excluded_ids = [],
    manual_order = [],
    layout = 'grid'
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Title is required' } });
  }

  const validTypes = ['manual', 'smart', 'hybrid'];
  const safeType = validTypes.includes(type) ? type : 'manual';
  const safeOperator = match_operator === 'any' ? 'any' : 'all';
  const validatedRules = validateRules(rules);

  try {
    const userId = req.user ? req.user.id : 'u-demo';
    const id = generateId();
    
    db.prepare(`
      INSERT INTO collections (
        id, user_id, title, description, cover_image, is_private, 
        type, match_operator, rules, pinned_ids, excluded_ids, manual_order, layout,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id, 
      userId, 
      title.trim(), 
      description ? description.trim() : null, 
      cover_image || null,
      is_private ? 1 : 0,
      safeType,
      safeOperator,
      JSON.stringify(validatedRules),
      JSON.stringify(Array.isArray(pinned_ids) ? pinned_ids : []),
      JSON.stringify(Array.isArray(excluded_ids) ? excluded_ids : []),
      JSON.stringify(Array.isArray(manual_order) ? manual_order : []),
      layout || 'grid'
    );

    const created = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
    let count = 0;
    if (safeType === 'smart' || safeType === 'hybrid') {
      const evaluated = evaluateSmartRules({
        rules: validatedRules,
        matchOperator: safeOperator,
        pinnedIds: pinned_ids,
        excludedIds: excluded_ids,
        userId
      });
      count = evaluated.length;
    }

    res.status(201).json(formatCollection(created, count));
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Update collection (PATCH)
router.patch('/:id', optionalAuth, (req, res) => {
  const collectionId = req.params.id;
  const userId = req.user ? req.user.id : 'u-demo';

  try {
    const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(collectionId);
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }

    const {
      title,
      description,
      is_private,
      isPrivate,
      cover_image,
      coverImage,
      type,
      match_operator,
      matchOperator,
      rules,
      pinned_ids,
      pinnedIds,
      excluded_ids,
      excludedIds,
      manual_order,
      manualOrder,
      layout
    } = req.body;

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc = description !== undefined ? description : existing.description;
    const newCover = coverImage !== undefined ? coverImage : (cover_image !== undefined ? cover_image : existing.cover_image);
    const newPrivate = isPrivate !== undefined ? (isPrivate ? 1 : 0) : (is_private !== undefined ? (is_private ? 1 : 0) : existing.is_private);
    const newType = type !== undefined ? type : existing.type;
    const newOperator = (matchOperator || match_operator) !== undefined ? (matchOperator || match_operator) : existing.match_operator;
    const newRules = rules !== undefined ? JSON.stringify(validateRules(rules)) : existing.rules;
    const newPinned = (pinnedIds || pinned_ids) !== undefined ? JSON.stringify(pinnedIds || pinned_ids) : existing.pinned_ids;
    const newExcluded = (excludedIds || excluded_ids) !== undefined ? JSON.stringify(excludedIds || excluded_ids) : existing.excluded_ids;
    const newManualOrder = (manualOrder || manual_order) !== undefined ? JSON.stringify(manualOrder || manual_order) : existing.manual_order;
    const newLayout = layout !== undefined ? layout : existing.layout;

    db.prepare(`
      UPDATE collections SET
        title = ?,
        description = ?,
        cover_image = ?,
        is_private = ?,
        type = ?,
        match_operator = ?,
        rules = ?,
        pinned_ids = ?,
        excluded_ids = ?,
        manual_order = ?,
        layout = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newTitle,
      newDesc,
      newCover,
      newPrivate,
      newType,
      newOperator,
      newRules,
      newPinned,
      newExcluded,
      newManualOrder,
      newLayout,
      collectionId
    );

    const updated = db.prepare('SELECT * FROM collections WHERE id = ?').get(collectionId);
    let count = 0;
    if (updated.type === 'smart' || updated.type === 'hybrid') {
      const parsedRules = updated.rules ? JSON.parse(updated.rules) : [];
      const parsedPinned = updated.pinned_ids ? JSON.parse(updated.pinned_ids) : [];
      const parsedExcluded = updated.excluded_ids ? JSON.parse(updated.excluded_ids) : [];
      const evaluated = evaluateSmartRules({
        rules: parsedRules,
        matchOperator: updated.match_operator,
        pinnedIds: parsedPinned,
        excludedIds: parsedExcluded,
        userId
      });
      count = evaluated.length;
    } else {
      const row = db.prepare('SELECT COUNT(*) as c FROM collection_items WHERE collection_id = ?').get(collectionId);
      count = row ? row.c : 0;
    }

    res.json(formatCollection(updated, count));
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Duplicate collection
router.post('/:id/duplicate', optionalAuth, (req, res) => {
  const collectionId = req.params.id;
  const userId = req.user ? req.user.id : 'u-demo';

  try {
    const original = db.prepare('SELECT * FROM collections WHERE id = ?').get(collectionId);
    if (!original) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }

    const newId = generateId();
    const newTitle = `${original.title} (Copy)`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO collections (
          id, user_id, title, description, cover_image, is_private, 
          type, match_operator, rules, pinned_ids, excluded_ids, manual_order, layout,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        newId,
        userId,
        newTitle,
        original.description,
        original.cover_image,
        original.is_private,
        original.type,
        original.match_operator,
        original.rules,
        original.pinned_ids,
        original.excluded_ids,
        original.manual_order,
        original.layout
      );

      // If manual collection, copy items too
      if (original.type === 'manual') {
        const items = db.prepare('SELECT content_id FROM collection_items WHERE collection_id = ?').all(collectionId);
        const insertItem = db.prepare('INSERT INTO collection_items (collection_id, content_id) VALUES (?, ?)');
        for (const it of items) {
          insertItem.run(newId, it.content_id);
        }
      }
    })();

    const duplicated = db.prepare('SELECT * FROM collections WHERE id = ?').get(newId);
    res.status(201).json(formatCollection(duplicated));
  } catch (err) {
    console.error('Error duplicating collection:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Delete collection
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Add item to manual collection
router.post('/:id/items/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }

    if (collection.type === 'smart') {
      // In smart collections, items cannot be manually added directly; recommend pins or hybrid
      return res.status(400).json({ 
        error: { code: 'INVALID_OPERATION', message: 'Cannot manually add items to a pure Smart Collection. Convert to Hybrid or add as Pin.' } 
      });
    }

    if (collection.type === 'hybrid') {
      // Add to pinned_ids
      const pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
      if (!pinned.includes(req.params.contentId)) {
        pinned.push(req.params.contentId);
        db.prepare('UPDATE collections SET pinned_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(pinned), collection.id);
      }
      return res.json({ success: true, pinned: true });
    }

    db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, content_id) VALUES (?, ?)')
      .run(req.params.id, req.params.contentId);
      
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Remove item from collection
router.delete('/:id/items/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }

    if (collection.type === 'smart' || collection.type === 'hybrid') {
      // If hybrid, remove from pinned and add to excluded
      let pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
      pinned = pinned.filter(id => id !== req.params.contentId);
      
      let excluded = collection.excluded_ids ? JSON.parse(collection.excluded_ids) : [];
      if (!excluded.includes(req.params.contentId)) {
        excluded.push(req.params.contentId);
      }

      db.prepare('UPDATE collections SET pinned_ids = ?, excluded_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(pinned), JSON.stringify(excluded), collection.id);

      return res.json({ success: true, excluded: true });
    }

    db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND content_id = ?')
      .run(req.params.id, req.params.contentId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Pin / Unpin item in collection
router.post('/:id/pin/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

    let pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
    let excluded = collection.excluded_ids ? JSON.parse(collection.excluded_ids) : [];

    // Remove from excluded if was excluded
    excluded = excluded.filter(id => id !== req.params.contentId);
    if (!pinned.includes(req.params.contentId)) {
      pinned.push(req.params.contentId);
    }

    db.prepare('UPDATE collections SET pinned_ids = ?, excluded_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(pinned), JSON.stringify(excluded), collection.id);

    res.json({ success: true, pinned: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.delete('/:id/pin/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

    let pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
    pinned = pinned.filter(id => id !== req.params.contentId);

    db.prepare('UPDATE collections SET pinned_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(pinned), collection.id);

    res.json({ success: true, pinned: false });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Exclude / Un-exclude item in collection
router.post('/:id/exclude/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

    let pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
    let excluded = collection.excluded_ids ? JSON.parse(collection.excluded_ids) : [];

    pinned = pinned.filter(id => id !== req.params.contentId);
    if (!excluded.includes(req.params.contentId)) {
      excluded.push(req.params.contentId);
    }

    db.prepare('UPDATE collections SET pinned_ids = ?, excluded_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(pinned), JSON.stringify(excluded), collection.id);

    res.json({ success: true, excluded: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.delete('/:id/exclude/:contentId', optionalAuth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

    let excluded = collection.excluded_ids ? JSON.parse(collection.excluded_ids) : [];
    excluded = excluded.filter(id => id !== req.params.contentId);

    db.prepare('UPDATE collections SET excluded_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(excluded), collection.id);

    res.json({ success: true, excluded: false });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Get items in a collection
router.get('/:id/items', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }

    // Smart or Hybrid Collection: evaluate rules
    if (collection.type === 'smart' || collection.type === 'hybrid') {
      const rules = collection.rules ? JSON.parse(collection.rules) : [];
      const pinned = collection.pinned_ids ? JSON.parse(collection.pinned_ids) : [];
      const excluded = collection.excluded_ids ? JSON.parse(collection.excluded_ids) : [];
      const manualOrder = collection.manual_order ? JSON.parse(collection.manual_order) : [];

      let items = evaluateSmartRules({
        rules,
        matchOperator: collection.match_operator,
        pinnedIds: pinned,
        excludedIds: excluded,
        userId
      });

      // Apply manual order if specified
      if (manualOrder && manualOrder.length > 0) {
        const orderMap = new Map();
        manualOrder.forEach((id, idx) => orderMap.set(id, idx));
        items.sort((a, b) => {
          const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : 99999;
          const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : 99999;
          return orderA - orderB;
        });
      }

      return res.json(items);
    }

    // Manual Collection: Join with content table
    const manualOrder = collection.manual_order ? JSON.parse(collection.manual_order) : [];
    const items = db.prepare(`
      SELECT c.*, ci.added_at,
        GROUP_CONCAT(ct.tag, '|||') as tags_concat,
        CASE WHEN si.content_id IS NOT NULL THEN 1 ELSE 0 END as is_saved
      FROM content c
      JOIN collection_items ci ON c.id = ci.content_id
      LEFT JOIN content_tags ct ON c.id = ct.content_id
      LEFT JOIN saved_items si ON c.id = si.content_id AND si.user_id = ?
      WHERE ci.collection_id = ?
      GROUP BY c.id
      ORDER BY ci.added_at DESC
    `).all(userId, req.params.id);

    const formattedItems = items.map(item => {
      let meta = {};
      if (item.metadata) {
        try { meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata; } catch (e) {}
      }
      const tags = item.tags_concat ? item.tags_concat.split('|||').filter(Boolean) : [];

      return {
        ...item,
        metadata: meta,
        tags,
        isSaved: Boolean(item.is_saved),
        imageUrl: item.image_url
      };
    });

    if (manualOrder && manualOrder.length > 0) {
      const orderMap = new Map();
      manualOrder.forEach((id, idx) => orderMap.set(id, idx));
      formattedItems.sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : 99999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : 99999;
        return orderA - orderB;
      });
    }

    res.json(formattedItems);
  } catch (err) {
    console.error('Error fetching collection items:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
