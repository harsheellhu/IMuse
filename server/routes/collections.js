import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const generateId = () => `c${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Get user's collections
router.get('/', requireAuth, (req, res) => {
  try {
    const collections = db.prepare(`
      SELECT c.*, COUNT(ci.content_id) as itemCount 
      FROM collections c
      LEFT JOIN collection_items ci ON c.id = ci.collection_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `).all(req.user.id);
    
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Create collection
router.post('/', requireAuth, (req, res) => {
  const { title, description, is_private } = req.body;
  if (!title) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Title is required' } });
  }

  try {
    const id = generateId();
    db.prepare('INSERT INTO collections (id, user_id, title, description, is_private) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.id, title, description || null, is_private ? 1 : 0);
      
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
    res.status(201).json({ ...collection, itemCount: 0 });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Delete collection
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM collections WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found or unauthorized' } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Add item to collection
router.post('/:id/items/:contentId', requireAuth, (req, res) => {
  try {
    // Verify ownership
    const collection = db.prepare('SELECT id FROM collections WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!collection) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found or unauthorized' } });
    }

    db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, content_id) VALUES (?, ?)')
      .run(req.params.id, req.params.contentId);
      
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Get items in a collection
router.get('/:id/items', requireAuth, (req, res) => {
  try {
    // Basic verification of access (if public, anyone can see; if private, only owner)
    const collection = db.prepare('SELECT user_id, is_private FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
    }
    
    if (collection.is_private && collection.user_id !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized' } });
    }

    // Join with content table to get the actual items
    const items = db.prepare(`
      SELECT c.* 
      FROM content c
      JOIN collection_items ci ON c.id = ci.content_id
      WHERE ci.collection_id = ?
      ORDER BY ci.added_at DESC
    `).all(req.params.id);

    // Parse JSON arrays
    const formattedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
      categories: item.categories ? JSON.parse(item.categories) : []
    }));

    res.json(formattedItems);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
