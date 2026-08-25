import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { limit = 30 } = req.query;
  try {
    const rows = db.prepare(`
      SELECT c.*, rv.viewed_at 
      FROM recent_views rv
      JOIN content c ON rv.content_id = c.id
      WHERE rv.user_id = ?
      ORDER BY rv.viewed_at DESC
      LIMIT ?
    `).all(req.user.id, limit);
    
    const history = rows.map(row => {
      const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(row.id).map(t => t.tag);
      return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        tags
      };
    });
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.post('/:contentId', requireAuth, (req, res) => {
  try {
    db.prepare(`
      INSERT INTO recent_views (user_id, content_id, viewed_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, content_id) DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
    `).run(req.user.id, req.params.contentId);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
