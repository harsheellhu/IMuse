import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, s.saved_at 
      FROM saved_items s
      JOIN content c ON s.content_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.saved_at DESC
    `).all(req.user.id);
    
    const saved = rows.map(row => {
      const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(row.id).map(t => t.tag);
      return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        tags
      };
    });
    
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.post('/:contentId', requireAuth, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO saved_items (user_id, content_id) VALUES (?, ?)')
      .run(req.user.id, req.params.contentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.delete('/:contentId', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM saved_items WHERE user_id = ? AND content_id = ?')
      .run(req.user.id, req.params.contentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
