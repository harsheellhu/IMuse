import express from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    const rows = db.prepare(`
      SELECT c.*, s.saved_at 
      FROM saved_items s
      JOIN content c ON s.content_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.saved_at DESC
    `).all(userId);
    
    const saved = rows.map(row => {
      const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(row.id).map(t => t.tag);
      const img = row.image_url || '';
      return {
        ...row,
        imageUrl: img,
        coverImage: img,
        posterImage: img,
        metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
        tags
      };
    });
    
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.post('/:contentId', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    db.prepare('INSERT OR IGNORE INTO saved_items (user_id, content_id) VALUES (?, ?)')
      .run(userId, req.params.contentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.delete('/:contentId', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    db.prepare('DELETE FROM saved_items WHERE user_id = ? AND content_id = ?')
      .run(userId, req.params.contentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
