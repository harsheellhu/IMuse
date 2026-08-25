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

export default router;
