import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all content with optional filters
router.get('/', (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM content';
    const params = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const rows = db.prepare(query).all(...params);
    
    // Process JSON metadata and tags
    const content = rows.map(row => {
      const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(row.id).map(t => t.tag);
      return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        tags
      };
    });
    
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content not found' } });
    }
    
    const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(row.id).map(t => t.tag);
    
    res.json({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      tags
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
