import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { q = '', limit = 30, page = 1 } = req.query;
  const offset = (Math.max(1, page) - 1) * limit;
  
  if (!q.trim()) {
    return res.json([]);
  }

  try {
    const queryStr = `%${q}%`;
    const rows = db.prepare(`
      SELECT DISTINCT c.* 
      FROM content c
      LEFT JOIN content_tags ct ON c.id = ct.content_id
      LEFT JOIN discovery_worlds w ON c.world_id = w.id
      WHERE c.title LIKE ? 
         OR c.description LIKE ? 
         OR c.creator LIKE ? 
         OR c.category LIKE ? 
         OR ct.tag LIKE ?
         OR w.name LIKE ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(queryStr, queryStr, queryStr, queryStr, queryStr, queryStr, limit, offset);
    
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

export default router;
